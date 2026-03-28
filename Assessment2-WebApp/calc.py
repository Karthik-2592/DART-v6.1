

smplngRate = 44100
FFTBins = 16384
freq = smplngRate / FFTBins
fmin, fmax = 20.0, 16000.0
barcount = 72



cutoff = [0.0]
for i in range(barcount):
    exp = (i/barcount)**1.1
    cutoff.append(fmin * (fmax/fmin ) ** exp)
cutoff.append(fmax)

BinRange = [round(c/freq) for c in cutoff]

# Print intervals (for Mapping.txt / debugging)
print("Mapping Summary:")
for i in range(len(cutoff)-1):
    print(f"{i+1} | {cutoff[i]} - {cutoff[i+1]} -> {BinRange[i]} - {BinRange[i+1]}")

# Format for Visualizer.tsx
print("\nFormatted for Visualizer.tsx:")
ranges = []
# Skip the first interval (usually 0 - 20Hz) - from mapping ID 2 to 97 (total 96 bars)
for i in range(1, len(BinRange)-1):
    ranges.append(f"[{BinRange[i]}, {BinRange[i+1]}]")

output = "const BIN_RANGES: [number, number][] = [\n  "
for i, r in enumerate(ranges):
    output += r + ", "
    if (i + 1) % 10 == 0:
        output += "\n  "

output = output.strip().rstrip(",") + "\n];"
print(output)
