import { useRef, useEffect, useState } from 'react';
import { useToast } from "@/hooks/use-toast";

interface ResultPanelProps {
  results: any[];
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
  
  // Get display value safely
  const getDisplayValue = (result: any): string | null => {
    if (result === null || result === undefined) return null;
    
    // First check for function type
    if (typeof result === 'function') {
      return null;
    }
    
    // Try to convert to string in a safe way
    try {
      // Special handling for complex numbers
      if (typeof result === 'object' && 
          result !== null && 
          're' in result && 
          'im' in result) {
        // Format complex number nicely
        const re = result.re;
        const im = result.im;
        
        if (im === 0) return `${re}`;
        if (re === 0 && im === 1) return `i`;
        if (re === 0) return `${im}i`;
        if (im === 1) return `${re} + i`;
        if (im === -1) return `${re} - i`;
        if (im < 0) return `${re} - ${Math.abs(im)}i`;
        return `${re} + ${im}i`;
      }
      
      // For other values
      const str = String(result);
      
      // Filter out error messages and function expressions or references
      if (str.includes('Error:') || 
          str.startsWith('function ') || 
          str.includes('=>') ||
          str.includes('[Function:')) {
        return null;
      }
      
      return str;
    } catch (e) {
      return null;
    }
  };
  
  // Copy result to clipboard
  const copyToClipboard = (result: any, index: number) => {
    // Get safe display value
    const displayValue = getDisplayValue(result);
    if (!displayValue) return;
    
    navigator.clipboard.writeText(displayValue).then(() => {
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
  
  // Calculate if a line will wrap based on length
  const isMultiline = (text: string): boolean => {
    return text.length > 30; // This is a simple heuristic, you might need to refine
  };
  
  return (
    <div className="w-full h-full flex flex-col overflow-hidden result-panel">
      <div 
        ref={panelRef}
        className="flex-1 overflow-auto h-full"
      >
        <div className="p-4 h-full">
          {/* Empty line at the top to match CodeMirror spacing */}
          <div className="h-[4px]"></div>
          
          {results.map((result, index) => {
            const displayValue = getDisplayValue(result);
            const willWrap = displayValue ? isMultiline(displayValue) : false;
            
            // Always create an empty div to maintain alignment
            return (
              <div 
                key={index} 
                className={`result-line ${willWrap ? 'min-h-[3.2rem] h-auto' : 'min-h-[1.6rem] h-[1.6rem]'} 
                  flex justify-end items-center overflow-x-auto px-2 ${
                  copiedIndex === index ? 'bg-[hsl(var(--editor-selection))] opacity-90' : ''
                }`}
                style={{ paddingTop: '0.15rem', paddingBottom: '0.15rem' }}
              >
                {displayValue && (
                  <span 
                    className={`result-value ml-auto px-2 py-0.5 rounded-md cursor-pointer
                              text-[hsl(var(--editor-result))] hover:bg-[hsl(var(--editor-result))] 
                              hover:text-[hsl(var(--editor-bg))] transition-all duration-200
                              ${willWrap ? 'multiline whitespace-pre-wrap' : 'whitespace-nowrap'}`}
                    onClick={() => copyToClipboard(result, index)}
                    onMouseEnter={() => onHighlightLine?.(index)}
                    onMouseLeave={() => onHighlightLine?.(null)}
                  >
                    {displayValue}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ResultPanel;