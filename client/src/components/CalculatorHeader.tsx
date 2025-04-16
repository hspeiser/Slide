import React from 'react';

// Minimal Header - thin bar with title, matching bg, draggable
const CalculatorHeader = () => {
  return (
    <header 
      className="h-6 bg-[hsl(var(--editor-bg))] flex-shrink-0 flex justify-center items-center relative" // Reduced from h-8 to h-6 (20% smaller)
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties} // Cast style object
    >
      <span className="text-xs font-medium text-gray-500">Slide</span>
      {/* Ensure traffic lights overlay correctly if window controls are overlayed */}
      {/* Placeholder for potential absolute positioned elements if needed */}
    </header>
  );
};

export default CalculatorHeader;
