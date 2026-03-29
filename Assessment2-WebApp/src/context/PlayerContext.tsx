import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";
import { type Song } from "../components/Categories";

const FFT_SIZE = 16384;

interface PlayerContextType {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  currentSong: Song | undefined;
  setCurrentSong: (song: Song | undefined) => void;
  contextSongs: Song[] | undefined;
  setContextSongs: (songs: Song[] | undefined) => void;
  isMiniPlayerOpen: boolean;
  setIsMiniPlayerOpen: (open: boolean) => void;
  wasPoppedOutByUser: boolean;
  setWasPoppedOutByUser: (val: boolean) => void;
  analyserRef: React.RefObject<AnalyserNode | null>;
  lastPlayedSongIdRef: React.MutableRefObject<number | string | undefined>;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastPlayedSongIdRef = useRef<number | string | undefined>(undefined);

  const [currentSong, setCurrentSong] = useState<Song | undefined>();
  const [contextSongs, setContextSongs] = useState<Song[] | undefined>();
  const [isMiniPlayerOpen, setIsMiniPlayerOpen] = useState(false);
  const [wasPoppedOutByUser, setWasPoppedOutByUser] = useState(false);

  const ensureAudioContext = useCallback(() => {
    if (audioCtxRef.current) return;
    const audio = audioRef.current;
    if (!audio) return;

    try {
      const ctx = new AudioContext({ sampleRate: 44100 });
      const analyser = ctx.createAnalyser();
      analyser.fftSize = FFT_SIZE;
      analyser.smoothingTimeConstant = 0.1;

      const source = ctx.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(ctx.destination);

      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
    } catch (e) {
      console.error("Web Audio API error", e);
    }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // React's useEffect runs bottom-up. Child components (like PlaybackControls)
    // might call audio.play() BEFORE this root provider's useEffect fires.
    // If it's already playing, ensure context immediately.
    if (!audio.paused) {
      ensureAudioContext();
      if (audioCtxRef.current?.state === "suspended") {
        audioCtxRef.current.resume();
      }
    }

    const handlePlay = () => {
      ensureAudioContext();
      if (audioCtxRef.current?.state === "suspended") {
        audioCtxRef.current.resume();
      }
    };
    
    audio.addEventListener("play", handlePlay);
    return () => audio.removeEventListener("play", handlePlay);
  }, [ensureAudioContext]);

  const audioSrc = currentSong 
    ? (currentSong.audio_path && !currentSong.audio_path.includes('/') 
        ? `http://localhost:5000/audio/${encodeURIComponent(currentSong.audio_path)}` 
        : `http://localhost:5000/${currentSong.audio_path?.split('/').map(encodeURIComponent).join('/')}`)
    : "";

  return (
    <PlayerContext.Provider value={{
      audioRef,
      currentSong,
      setCurrentSong,
      contextSongs,
      setContextSongs,
      isMiniPlayerOpen,
      setIsMiniPlayerOpen,
      wasPoppedOutByUser,
      setWasPoppedOutByUser,
      analyserRef,
      lastPlayedSongIdRef
    }}>
      {children}
      <audio ref={audioRef} src={audioSrc} preload="metadata" crossOrigin="anonymous" />
    </PlayerContext.Provider>
  );
}
