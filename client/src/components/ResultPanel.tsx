import { forwardRef, useRef, useEffect } from 'react';

interface ResultPanelProps {
  results: (string | null)[];
}

const ResultPanel = forwardRef<HTMLDivElement, ResultPanelProps>(
  ({ results }, ref) => {
    const panelRef = useRef<HTMLDivElement>(null);
    
    // Sync scroll position with editor panel
    useEffect(() => {
      const handleScroll = (e: Event) => {
        const target = e.target as HTMLElement;
        if (!target || !panelRef.current) return;
        
        if (target.classList.contains('editor-container') || target.closest('.editor-container')) {
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
          ref={(el) => {
            // Handle both refs
            if (ref) {
              if (typeof ref === 'function') {
                ref(el);
              } else {
                ref.current = el;
              }
            }
            panelRef.current = el;
          }}
          className="flex-1 overflow-auto"
        >
          <div className="p-4 text-right">
            {results.map((result, index) => (
              <div key={index} className="min-h-[1.5rem] mb-[3px]">
                {result && (
                  <span 
                    className={`result-value ${result.startsWith('Error:') ? 'text-[hsl(var(--editor-error))]' : 'text-[hsl(var(--editor-result))]'}`}
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
  }
);

ResultPanel.displayName = 'ResultPanel';

export default ResultPanel;
