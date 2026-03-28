import { useRef, useEffect, useCallback } from "react";
import PlaybackControls from "./PlaybackControls";
import { type Song } from "./Categories";

// ── Constants ──
const NUM_BARS = 72;
const FFT_SIZE = 16384;
const UPDATE_INTERVAL_MS = 50;

// ── Normalization tuning ──
const DECAY_RATE = 0.997;       // running-max decay per frame (~3 s half-life @ 60 fps)
const ATTACK_RATE = 0.7;        // how fast running-max rises to a new peak
const CURVE_EXP = 5;          // gentler power curve (was 4)
const LOCAL_WEIGHT = 0.8;      // blend: local Gaussian-zone vs global running-max
const GLOBAL_WEIGHT = 1 - LOCAL_WEIGHT;

// ── Smoothing tuning ──
const RISE_FACTOR = 0.14;       // bars grow quickly
const FALL_FACTOR = 0.04;       // bars fall slowly
const MAX_DELTA = 8;            // max change per frame (% of canvas)

// ── Peak detection tuning ──
const MAX_PEAKS = 2;
const MIN_PROMINENCE = 0.20;
const SIGMA = 0.3;                // Gaussian influence radius (bar-index units)
const TWO_SIGMA_SQ = 2 * SIGMA * SIGMA;

// Pre-calculated bin ranges (0-based, end-exclusive) for 96 bars
const BIN_RANGES: [number, number][] = [
  [7, 8], [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [13, 14], [14, 16], [16, 17], [17, 19], 
  [19, 21], [21, 23], [23, 25], [25, 27], [27, 30], [30, 33], [33, 36], [36, 40], [40, 43], [43, 48], 
  [48, 52], [52, 57], [57, 63], [63, 69], [69, 76], [76, 83], [83, 91], [91, 100], [100, 110], [110, 120], 
  [120, 132], [132, 145], [145, 159], [159, 175], [175, 192], [192, 210], [210, 231], [231, 253], [253, 278], [278, 305], 
  [305, 334], [334, 367], [367, 403], [403, 442], [442, 485], [485, 532], [532, 584], [584, 640], [640, 703], [703, 771], 
  [771, 846], [846, 928], [928, 1019], [1019, 1118], [1118, 1226], [1226, 1346], [1346, 1477], [1477, 1620], [1620, 1778], [1778, 1951], 
  [1951, 2141], [2141, 2349], [2349, 2578], [2578, 2828], [2828, 3104], [3104, 3405], [3405, 3737], [3737, 4100], [4100, 4499], [4499, 4937], 
  [4937, 5417], [5417, 5944]
];

// Pre-compute Gaussian weight table (bar i → bar j contribution)
// Only store weights within ±3σ for each bar (beyond that ≈ 0)
const GAUSS_RADIUS = Math.ceil(3 * SIGMA);
const GAUSS_TABLE = new Float32Array(NUM_BARS * (2 * GAUSS_RADIUS + 1));
for (let center = 0; center < NUM_BARS; center++) {
  for (let offset = -GAUSS_RADIUS; offset <= GAUSS_RADIUS; offset++) {
    const j = center + offset;
    const idx = center * (2 * GAUSS_RADIUS + 1) + (offset + GAUSS_RADIUS);
    GAUSS_TABLE[idx] = (j >= 0 && j < NUM_BARS)
      ? Math.exp(-(offset * offset) / TWO_SIGMA_SQ)
      : 0;
  }
}

// HSL hues for 64 bars (0 → 290)
const redBars = Math.round(NUM_BARS * 0.15);
const midBars = Math.round(NUM_BARS * 0.25);
const highLBars = Math.round(NUM_BARS * 0.4);
const highHBars = NUM_BARS -  redBars - midBars - highLBars;
const BAR_HUES = [
  ...Array.from({ length: redBars }, (_, i) => Math.round((i / (redBars - 1)) * 20)),
  ...Array.from({ length: midBars }, (_, i) => Math.round(20 + (i / (midBars - 1)) * 100)),
  ...Array.from({ length: highLBars }, (_, i) => Math.round(160 + (i / (highLBars - 1)) * 130)),
  ...Array.from({ length: highHBars }, (_, i) => Math.round(290 + (i / (highHBars - 1)) * 10)),
];

// Frequency-band weights (damped extremes)
const WEIGHTS = new Float32Array(NUM_BARS);
for (let i = 0; i < NUM_BARS; i++) {
  if (i < 18) WEIGHTS[i]= 0.9 + (i/18)*0.2
  else if (i < 36) WEIGHTS[i] = 1.1 + (i / 36) * 0.1;
  else if (i > 60) WEIGHTS[i] = 1.2 + ((i - 60) / 12) * 0.2;
  else WEIGHTS[i] = 1.2;
}

// ── Prominence-based peak detection (Alt 3) ──
function findPeaks(values: Float32Array): number[] {
  const peaks: { idx: number; prom: number }[] = [];

  for (let i = 1; i < NUM_BARS - 1; i++) {
    if (values[i] <= values[i - 1] || values[i] <= values[i + 1]) continue;

    // Walk left/right to find the lowest valley before a taller neighbor
    let leftMin = values[i];
    for (let l = i - 1; l >= 0; l--) {
      leftMin = Math.min(leftMin, values[l]);
      if (values[l] > values[i]) break;
    }
    let rightMin = values[i];
    for (let r = i + 1; r < NUM_BARS; r++) {
      rightMin = Math.min(rightMin, values[r]);
      if (values[r] > values[i]) break;
    }

    const prom = values[i] - Math.max(leftMin, rightMin);
    if (prom >= MIN_PROMINENCE) peaks.push({ idx: i, prom });
  }

  // Return top-N by prominence
  peaks.sort((a, b) => b.prom - a.prom);
  const result: number[] = [];
  for (let i = 0; i < Math.min(peaks.length, MAX_PEAKS); i++) result.push(peaks[i].idx);
  return result;
}

export default function Visualizer({ song }: { song?: Song }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const glowCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const rafRef = useRef<number>(0);
  const lastUpdateRef = useRef<number>(0);

  // Reusable typed arrays (avoid per-frame allocation)
  const rawRef = useRef(new Float32Array(NUM_BARS));
  const normRef = useRef(new Float32Array(NUM_BARS));
  const currentHeightsRef = useRef(new Float32Array(NUM_BARS));
  const targetHeightsRef = useRef(new Float32Array(NUM_BARS));
  const fftDataRef = useRef<Float32Array | null>(null);

  // Running-max for history-aware normalization (Alt 1)
  const runningMaxRef = useRef(0.01);

  // Smooth color state
  const currentHueRef = useRef(0);
  const targetHueRef = useRef(0);
  const currentSatRef = useRef(0);
  const currentLightRef = useRef(100);
  const hasStartedRef = useRef(false);

  // ── Lazily initialise Web Audio on first play ──
  const ensureAudioContext = useCallback(() => {
    if (audioCtxRef.current) return;
    const audio = audioRef.current;
    if (!audio) return;

    const ctx = new AudioContext({ sampleRate: 44100 });
    const analyser = ctx.createAnalyser();
    analyser.fftSize = FFT_SIZE;
    analyser.smoothingTimeConstant = 0.1;

    const source = ctx.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(ctx.destination);

    audioCtxRef.current = ctx;
    analyserRef.current = analyser;
    sourceRef.current = source;

    // Allocate FFT buffer once
    fftDataRef.current = new Float32Array(analyser.frequencyBinCount);
  }, []);

  // ── Render loop ──
  useEffect(() => {
    const renderLoop = (timestamp: number) => {
      rafRef.current = requestAnimationFrame(renderLoop);

      const canvas = canvasRef.current;
      const glowCanvas = glowCanvasRef.current;
      const analyser = analyserRef.current;
      if (!canvas || !glowCanvas) return;

      const ctx = canvas.getContext("2d");
      const glowCtx = glowCanvas.getContext("2d");
      if (!ctx || !glowCtx) return;

      // Handle resize
      let { width, height } = canvas.getBoundingClientRect();
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        glowCanvas.width = width;
        canvas.height = height - 140;
        glowCanvas.height = height - 140;
        height -= 140;
      }

      // ── 1. FFT extraction + normalization (throttled) ──
      if (analyser && timestamp - lastUpdateRef.current >= UPDATE_INTERVAL_MS) {
        lastUpdateRef.current = timestamp;

        const data = new Float32Array(fftDataRef.current!);
        analyser.getFloatFrequencyData(data);

        const minDb = analyser.minDecibels;
        const dbRange = analyser.maxDecibels - minDb;
        const raw = rawRef.current;
        const norm = normRef.current;

        // Bin-average into NUM_BARS weighted values
        let frameMax = 0;
        for (let i = 0; i < NUM_BARS; i++) {
          const start = BIN_RANGES[i][0], end = BIN_RANGES[i][1];
          let sum = 0;
          for (let b = start; b < end; b++) {
            sum += (Math.max(minDb, Math.min(minDb + dbRange, data[b])) - minDb) / dbRange;
          }
          const h = (sum / (end - start)) * WEIGHTS[i];
          raw[i] = h;
          if (h > frameMax) frameMax = h;
        }

        // ── Alt 1: Running-max with decay ──
        if (frameMax > runningMaxRef.current) {
          runningMaxRef.current += (frameMax - runningMaxRef.current) * ATTACK_RATE;
        } else {
          runningMaxRef.current *= DECAY_RATE;
        }
        const globalMax = Math.max(runningMaxRef.current, 0.01);

        // ── Alt 3: Prominence-based peaks ──
        const peakIdxs = findPeaks(raw);

        // ── Alt 4: Gaussian influence-zone normalization ──
        const stride = 2 * GAUSS_RADIUS + 1;
        for (let i = 0; i < NUM_BARS; i++) {
          let weightedDenom = 0, totalWeight = 0;

          // Accumulate Gaussian-weighted peak contributions
          for (let p = 0; p < peakIdxs.length; p++) {
            const pi = peakIdxs[p];
            const offset = i - pi;
            if (Math.abs(offset) > GAUSS_RADIUS) continue;
            const w = GAUSS_TABLE[pi * stride + (offset + GAUSS_RADIUS)];
            weightedDenom += raw[pi] * w;
            totalWeight += w;
          }

          const localDenom = totalWeight > 0 ? weightedDenom / totalWeight : globalMax;
          const denom = localDenom * LOCAL_WEIGHT + globalMax * GLOBAL_WEIGHT;
          const rel = raw[i] / Math.max(denom, 0.01);
          norm[i] = Math.min(100, Math.pow(rel, CURVE_EXP) * 100);
        }

        // Dominant-bar color
        let maxIdx = 0;
        for (let i = 1; i < NUM_BARS; i++) {
          if (raw[i] > raw[maxIdx]) maxIdx = i;
        }
        if (frameMax > 0.1) {
          hasStartedRef.current = true;
          targetHueRef.current = BAR_HUES[maxIdx];
        }

        targetHeightsRef.current.set(norm);
      }

      // ── 2. Canvas Drawing ──
      ctx.clearRect(0, 0, width, height);
      glowCtx.clearRect(0, 0, width, height);

      const targets = targetHeightsRef.current;
      const currents = currentHeightsRef.current;

      // Color lerp
      if (hasStartedRef.current) {
        currentHueRef.current += (targetHueRef.current - currentHueRef.current) * 0.02;
        currentSatRef.current += (100 - currentSatRef.current) * 0.02;
        currentLightRef.current += (55 - currentLightRef.current) * 0.02;
      }

      const hue = currentHueRef.current;
      const sat = currentSatRef.current;
      const lit = currentLightRef.current;
      const fillColor = `hsl(${hue}, ${sat}%, ${lit}%)`;

      const barGap = 3;
      const barWidth = Math.max(2, (width - barGap * (NUM_BARS - 1)) / NUM_BARS);
      const drawHeight = height - 10;

      // Set fill once for both contexts
      ctx.fillStyle = fillColor;
      glowCtx.fillStyle = fillColor;

      let x = 0;
      for (let i = 0; i < NUM_BARS; i++) {
        // Asymmetric EMA with velocity clamp
        let delta = targets[i] - currents[i];
        delta *= delta > 0 ? RISE_FACTOR : FALL_FACTOR;
        if (delta > MAX_DELTA) delta = MAX_DELTA;
        else if (delta < -MAX_DELTA) delta = -MAX_DELTA;
        currents[i] += delta;

        const barPx = Math.max(2, (currents[i] / 100) * drawHeight);
        const y = height - barPx;

        // Glow + crisp in single pass
        glowCtx.fillRect(x, y, barWidth, barPx);
        ctx.fillRect(x, y, barWidth, barPx);

        x += barWidth + barGap;
      }
    };

    rafRef.current = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // ── Wire up AudioContext on play events ──
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => {
      ensureAudioContext();
      if (audioCtxRef.current?.state === "suspended") {
        audioCtxRef.current.resume();
      }
    };

    audio.addEventListener("play", handlePlay);
    return () => audio.removeEventListener("play", handlePlay);
  }, [ensureAudioContext]);

  const audioSrc = song ? `http://localhost:5000/${song.audio_path.split('/').map(encodeURIComponent).join('/')}` : "";

  return (
    <section className="flex justify-center w-full">
      <audio ref={audioRef} src={audioSrc} preload="metadata" crossOrigin="anonymous" />

      <div
        className="w-full rounded-[3px] flex flex-col justify-between relative"
        style={{ height: "900px" }}
      >
        {/* Visualizer Canvas Container */}
        <div className="flex-1 w-full px-9 pt-12 pb-10 relative flex justify-center items-end">
          <canvas
            ref={glowCanvasRef}
            className="absolute inset-0 w-full h-full block z-0 pointer-events-none"
            style={{ filter: "blur(900px) brightness(2)" }}
          />
          <canvas
            ref={canvasRef}
            className="relative w-full h-full block z-10"
            style={{ imageRendering: "pixelated" }}
          />
        </div>

        {/* Track Title */}
        <div className="px-8 pb-3 text-center z-10">
          <h2 className="text-2xl font-bold tracking-wider font-[var(--font-family-heading)] text-fg-primary">
            {song ? song.title : "TRACK TITLE PLACEHOLDER"}
          </h2>
          <p className="text-sm font-[var(--font-family-body)] text-fg-muted mt-0.5 tracking-wide">
            {song ? song.artists : "Artist Name Placeholder"}
          </p>
        </div>

        {/* Playback controls */}
        <div className="w-full h-42 bg-transparent px-8 pb-8 z-10">
          <PlaybackControls audioRef={audioRef} song={song} />
        </div>
      </div>
    </section>
  );
}
