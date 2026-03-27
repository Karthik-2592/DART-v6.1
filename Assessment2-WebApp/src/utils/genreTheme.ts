export const genreColorMap: Record<string, { color: string; glow: string }> = {
  "Drumstep": { color: "#ef4444", glow: "rgba(239, 68, 68, 0.25)" },
  "Indie Dance": { color: "#f97316", glow: "rgba(249, 115, 22, 0.25)" },
  "House": { color: "#eab308", glow: "rgba(234, 179, 8, 0.25)" },
  "Trap": { color: "#22c55e", glow: "rgba(34, 197, 94, 0.25)" },
  "Glitch Hop": { color: "#4ade80", glow: "rgba(74, 222, 128, 0.25)" },
  "Melodic Dubstep": { color: "#2dd4bf", glow: "rgba(45, 212, 191, 0.25)" },
  "Dubstep": { color: "#3b82f6", glow: "rgba(59, 130, 246, 0.25)" },
  "Future House": { color: "#a855f7", glow: "rgba(168, 85, 247, 0.25)" },
  "Drum & Bass": { color: "#ec4899", glow: "rgba(236, 72, 153, 0.25)" },
  "Future Bass": { color: "#c084fc", glow: "rgba(192, 132, 252, 0.25)" },
  "EDM / Hardstyle": { color: "#ffffff", glow: "rgba(255, 255, 255, 0.25)" },
  "Dark / Bass": { color: "#000000", glow: "rgba(255, 255, 255, 0.15)" },
  "Phonk": { color: "#14b8a6", glow: "rgba(20, 184, 166, 0.25)" },
};

const defaultColor = { color: "#ffffff", glow: "rgba(255, 255, 255, 0.25)" };

export const getGenreTheme = (genre: string) => {
  return genreColorMap[genre] || defaultColor;
};
