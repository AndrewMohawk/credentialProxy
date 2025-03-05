import type React from 'react';

export const PulseAnimation: React.FC = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="absolute w-32 h-32 bg-green-500 rounded-full opacity-75 animate-ping" />
      <div className="absolute w-32 h-32 bg-green-500 rounded-full opacity-75 animate-pulse" />
    </div>
  );
};

