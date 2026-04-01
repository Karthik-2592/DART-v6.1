import React from 'react';

interface LogoProps {
  className?: string;
  style?: React.CSSProperties;
}

const Logo: React.FC<LogoProps> = ({ className, style }) => {
  return (
    <svg
      width="1080"
      height="1080"
      viewBox="0 0 1080 1080"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      <g>
        <path
          fill="currentColor"
          d="M 746.79471,215.22209 1024.2497,75.19808 882.92916,351.35654 Z"
        />
        <path
          fill="currentColor"
          d="M 669.0036,191.88475 910.15606,422.66506 390.2521,784.39376 295.60624,685.85834 Z"
        />
        <path
          fill="currentColor"
          d="M 556.20648,715.67828 357.83913,841.44059 461.56062,1042.4009 Z"
        />
        <path
          fill="currentColor"
          d="M 37.531921,583.8081 236.28729,708.95629 373.24141,528.99299 Z"
        />
      </g>
    </svg>
  );
};

export default Logo;
