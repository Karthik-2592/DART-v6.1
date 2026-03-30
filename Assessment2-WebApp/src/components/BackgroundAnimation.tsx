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
          filter: "blur(70px) brightness(1.3)" 
        }} 
        preserveAspectRatio="none" 
        viewBox="0 0 1000 600"
      >
        <defs>
          <style>
            {`
              @keyframes float1 { 0% { transform: translateY(0px) translateX(0px); } 50% { transform: translateY(-40px) translateX(20px); } 100% { transform: translateY(0px) translateX(0px); } }
              @keyframes float2 { 0% { transform: translateY(0px) translateX(0px); } 50% { transform: translateY(-50px) translateX(-25px); } 100% { transform: translateY(0px) translateX(0px); } }
              @keyframes float3 { 0% { transform: translateY(0px) translateX(0px); } 50% { transform: translateY(-35px) translateX(30px); } 100% { transform: translateY(0px) translateX(0px); } }
              .blob1 { animation: float1 9s ease-in-out infinite; opacity: 0.15; }
              .blob2 { animation: float2 12s ease-in-out infinite; opacity: 0.12; }
              .blob3 { animation: float3 14s ease-in-out infinite; opacity: 0.10; }
            `}
          </style>
        </defs>
        <circle cx="120" cy="480" r="140" fill="var(--color-accent)" className="blob1"/>
        <circle cx="880" cy="80" r="180" fill="var(--color-accent)" className="blob2"/>
        <circle cx="650" cy="300" r="160" fill="var(--color-accent)" className="blob3"/>
        <circle cx="250" cy="120" r="120" fill="var(--color-accent)" className="blob1" style={{ animationDelay: '2s' }}/>
        <circle cx="950" cy="520" r="100" fill="var(--color-accent)" className="blob2" style={{ animationDelay: '3s' }}/>
        <circle cx="80" cy="300" r="130" fill="var(--color-accent)" className="blob3" style={{ animationDelay: '4s' }}/>
        <circle cx="520" cy="580" r="110" fill="var(--color-accent)" className="blob1" style={{ animationDelay: '1s' }}/>
      </svg>
    </div>
  );
}
