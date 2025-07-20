import React from 'react';

interface AidaLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const AidaLogo: React.FC<AidaLogoProps> = ({ className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Gradient Definitions */}
        <defs>
          <linearGradient id="neuralGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00D4FF" stopOpacity="1" />
            <stop offset="50%" stopColor="#8B5CF6" stopOpacity="1" />
            <stop offset="100%" stopColor="#00FF88" stopOpacity="1" />
          </linearGradient>
          
          <radialGradient id="glowGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.8" />
            <stop offset="70%" stopColor="#8B5CF6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>

          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Background Glow */}
        <circle cx="50" cy="50" r="45" fill="url(#glowGradient)" opacity="0.3">
          <animate attributeName="r" values="40;48;40" dur="4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.2;0.4;0.2" dur="4s" repeatCount="indefinite" />
        </circle>

        {/* Neural Network Connections */}
        <g stroke="url(#neuralGradient)" strokeWidth="1" fill="none" opacity="0.6">
          <path d="M20,30 Q50,20 80,30" strokeDasharray="2,2">
            <animate attributeName="stroke-dashoffset" values="0;-4" dur="2s" repeatCount="indefinite" />
          </path>
          <path d="M20,50 Q50,40 80,50" strokeDasharray="2,2">
            <animate attributeName="stroke-dashoffset" values="0;-4" dur="2.5s" repeatCount="indefinite" />
          </path>
          <path d="M20,70 Q50,60 80,70" strokeDasharray="2,2">
            <animate attributeName="stroke-dashoffset" values="0;-4" dur="3s" repeatCount="indefinite" />
          </path>
        </g>

        {/* Neural Nodes */}
        <g fill="#00D4FF">
          <circle cx="20" cy="30" r="2">
            <animate attributeName="r" values="1.5;3;1.5" dur="3s" repeatCount="indefinite" />
          </circle>
          <circle cx="20" cy="50" r="2">
            <animate attributeName="r" values="1.5;3;1.5" dur="3.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="20" cy="70" r="2">
            <animate attributeName="r" values="1.5;3;1.5" dur="4s" repeatCount="indefinite" />
          </circle>
          <circle cx="80" cy="30" r="2">
            <animate attributeName="r" values="1.5;3;1.5" dur="2.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="80" cy="50" r="2">
            <animate attributeName="r" values="1.5;3;1.5" dur="3.2s" repeatCount="indefinite" />
          </circle>
          <circle cx="80" cy="70" r="2">
            <animate attributeName="r" values="1.5;3;1.5" dur="3.8s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* Main AIDA Letter 'A' with Circuit Design */}
        <g filter="url(#glow)">
          {/* Letter A Base */}
          <path
            d="M35 75 L50 25 L65 75 M40 60 L60 60"
            stroke="url(#neuralGradient)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          
          {/* Circuit Elements on A */}
          <g fill="#00FF88" opacity="0.8">
            {/* Top circuit node */}
            <rect x="48" y="23" width="4" height="4" rx="1">
              <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
            </rect>
            
            {/* Side circuit nodes */}
            <rect x="38" y="45" width="3" height="3" rx="0.5">
              <animate attributeName="opacity" values="0.5;1;0.5" dur="2.5s" repeatCount="indefinite" />
            </rect>
            <rect x="59" y="45" width="3" height="3" rx="0.5">
              <animate attributeName="opacity" values="0.5;1;0.5" dur="3s" repeatCount="indefinite" />
            </rect>
            
            {/* Bottom circuit nodes */}
            <rect x="33" y="73" width="3" height="3" rx="0.5">
              <animate attributeName="opacity" values="0.5;1;0.5" dur="2.2s" repeatCount="indefinite" />
            </rect>
            <rect x="64" y="73" width="3" height="3" rx="0.5">
              <animate attributeName="opacity" values="0.5;1;0.5" dur="2.8s" repeatCount="indefinite" />
            </rect>
          </g>

          {/* Circuit Lines */}
          <g stroke="#8B5CF6" strokeWidth="1" fill="none" opacity="0.6">
            <path d="M50,27 L50,35" strokeDasharray="1,1">
              <animate attributeName="stroke-dashoffset" values="0;-2" dur="1.5s" repeatCount="indefinite" />
            </path>
            <path d="M40,47 L35,52" strokeDasharray="1,1">
              <animate attributeName="stroke-dashoffset" values="0;-2" dur="1.8s" repeatCount="indefinite" />
            </path>
            <path d="M60,47 L65,52" strokeDasharray="1,1">
              <animate attributeName="stroke-dashoffset" values="0;-2" dur="2.1s" repeatCount="indefinite" />
            </path>
          </g>
        </g>

        {/* Pulsing Core */}
        <circle cx="50" cy="50" r="3" fill="#00D4FF" opacity="0.8">
          <animate attributeName="r" values="2;5;2" dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.6;1;0.6" dur="3s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  );
};

export default AidaLogo;