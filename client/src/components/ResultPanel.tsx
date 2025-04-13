import { useRef, useEffect } from 'react';

interface ResultPanelProps {
  results: (string | null)[];
}

const ResultPanel = ({ results }: ResultPanelProps) => {
  const panelRef = useRef<HTMLDivElement>(null);
  
  // Sync scroll position with editor panel
  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      if (!target || !panelRef.current) return;
      
      // Check if target is an element with classList before trying to use contains
      if (target && target.classList && 
          (target.classList.contains('editor-container') || target.closest('.editor-container'))) {
        panelRef.current.scrollTop = target.scrollTop;
      }
    };
    
    document.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, []);
  
  return (
    <div className="w-full md:w-48 lg:w-64 flex flex-col overflow-hidden">
      <div 
        ref={panelRef}
        className="flex-1 overflow-auto"
      >
        <div className="p-4">
          {results.map((result, index) => (
            <div key={index} className="min-h-[1.5rem] mb-[3px] text-right whitespace-nowrap overflow-x-auto">
              {result && (
                <span 
                  className={`result-value inline-block ${result.startsWith('Error:') ? 'text-[hsl(var(--editor-error))]' : 'text-[hsl(var(--editor-result))]'}`}
                >
                  {result}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResultPanel;
