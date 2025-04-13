import { useRef, useEffect, useState } from 'react';
import { useToast } from "@/hooks/use-toast";

interface ResultPanelProps {
  results: (string | null)[];
  onHighlightLine?: (index: number | null) => void;
}

const ResultPanel = ({ results, onHighlightLine }: ResultPanelProps) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  
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
  
  // Copy result to clipboard
  const copyToClipboard = (result: string, index: number) => {
    navigator.clipboard.writeText(result).then(() => {
      toast({
        title: "Copied!",
        description: "Result copied to clipboard",
        duration: 1500,
      });
      
      // Highlight the corresponding editor line
      onHighlightLine?.(index);
      setCopiedIndex(index);
      
      // Clear highlight after a delay
      setTimeout(() => {
        onHighlightLine?.(null);
        setCopiedIndex(null);
      }, 1000);
    });
  };
  
  return (
    <div className="w-full md:w-48 lg:w-64 flex flex-col overflow-hidden result-panel">
      <div 
        ref={panelRef}
        className="flex-1 overflow-auto"
      >
        <div className="p-4">
          {results.map((result, index) => (
            <div 
              key={index} 
              className={`result-line min-h-[1.5rem] h-[1.5rem] text-right whitespace-nowrap overflow-x-auto px-4 py-[0.08rem] ${
                copiedIndex === index ? 'bg-[hsl(var(--editor-selection))] opacity-90' : ''
              }`}
            >
              {result && (
                <span 
                  className="result-value inline-block px-2 py-0.5 rounded-md cursor-pointer
                            text-[hsl(var(--editor-result))] hover:bg-[hsl(var(--editor-result))] 
                            hover:text-[hsl(var(--editor-bg))] transition-all duration-200"
                  onClick={() => copyToClipboard(result, index)}
                  onMouseEnter={() => onHighlightLine?.(index)}
                  onMouseLeave={() => onHighlightLine?.(null)}
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
