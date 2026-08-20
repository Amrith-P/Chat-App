import React from 'react';

/**
 * Pulse-X Messenger Brand Logo
 * Features a Pulse ECG heartbeat line inside a modern chat bubble.
 */
export const PulseLogo = ({ 
  size = 'w-6 h-6', 
  strokeColor = '#10b981', 
  bubbleBg = '#020617', 
  className = '' 
}) => {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${size} ${className}`}
    >
      {/* Chat Bubble Background */}
      <path
        d="M 50 16 C 28 16 14 30 14 48 C 14 57 18 66 26 72 C 24 80 18 84 14 86 C 24 86 34 81 39 77 C 43 78 46 78 50 78 C 72 78 86 64 86 48 C 86 30 72 16 50 16 Z"
        fill={bubbleBg}
        stroke={strokeColor}
        strokeWidth="3"
      />

      {/* ECG Heartbeat Pulse Line */}
      <path
        d="M 24 48 L 36 48 L 42 34 L 50 64 L 58 38 L 64 48 L 76 48"
        stroke={strokeColor}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default PulseLogo;
