export default function BackgroundAnimation() {
  return (
    <div 
      className="fixed inset-0 w-full h-full pointer-events-none overflow-hidden" 
      style={{ zIndex: -50 }}
    >
      <svg 
        style={{ 
          position: "absolute", 
          top: 0, 
          left: 0, 
          width: "100%", 
          height: "100%", 
          filter: "blur(70px) opacity(0.2)" 
        }} 
        preserveAspectRatio="none" 
        viewBox="0 0 1000 600"
      >
        <defs>
        </defs>
        <circle cx="880" cy="80" r="180" fill="var(--color-accent)" className="blob2"/>
        <circle cx="650" cy="300" r="160" fill="var(--color-accent)" className="blob3"/>
        <circle cx="250" cy="120" r="120" fill="var(--color-accent)" className="blob1" />
        <circle cx="950" cy="520" r="100" fill="var(--color-accent)" className="blob2"/>
        <circle cx="80" cy="300" r="130" fill="var(--color-accent)" className="blob3" />
        <circle cx="520" cy="580" r="110" fill="var(--color-accent)" className="blob1" />
      </svg>
    </div>
  );
}
