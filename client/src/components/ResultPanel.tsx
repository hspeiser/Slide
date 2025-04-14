import { useRef, useEffect, useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { LineWrapInfo } from './EditorPanel';
import { motion } from 'framer-motion';

interface ResultPanelProps {
  results: any[];
  onHighlightLine?: (index: number | null) => void;
  wrapInfo?: LineWrapInfo;
}

const ResultPanel = ({ results, onHighlightLine, wrapInfo = {} }: ResultPanelProps) => {
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
  
  return (
    <div className="w-full h-full flex flex-col overflow-hidden result-panel">
      <div 
        ref={panelRef}
        className="flex-1 overflow-auto h-full"
        style={{
          fontFamily: "'Fira Code', 'JetBrains Mono', 'Roboto Mono', monospace",
          fontSize: "15px",
          lineHeight: "1.6",
          letterSpacing: "0.3px",
        }}
      >
        <div className="p-4 h-full">
          {/* Empty line at the top to match CodeMirror spacing */}
          <div className="h-[4px]"></div>
          
          {results.map((result, index) => {
            const displayValue = getDisplayValue(result);
            
            // Determine the height based on wrapInfo from the editor
            const visualLines = wrapInfo[index] || 1; // Default to 1 line if no info
            const minHeight = `${visualLines * 1.6}rem`; // Calculate height based on visual lines (1.6rem is default line height)
            
            return (
              <div 
                key={index} 
                className={`result-line flex justify-end items-start overflow-x-auto px-2 
                  transition-colors duration-200 ease-in-out ${
                  copiedIndex === index ? 'bg-[hsl(var(--editor-selection))] opacity-90' : ''
                }`}
                style={{
                   minHeight: minHeight, // Set dynamic min-height
                   paddingTop: '0.15rem', // Match editor line padding
                   paddingBottom: '0.15rem' // Match editor line padding
                 }}
              >
                {/* Animate result value presence and change */}
                {displayValue && (
                  <motion.span 
                    key={`${index}-${displayValue}`}
                    className={`result-value ml-auto px-2 py-0.5 rounded-md cursor-pointer
                              text-[hsl(var(--editor-result))] hover:bg-[hsl(var(--editor-result))] 
                              hover:text-[hsl(var(--editor-bg))] transition-all duration-200 ease-in-out
                              whitespace-nowrap`}
                    onClick={() => copyToClipboard(result, index)}
                    onMouseEnter={() => onHighlightLine?.(index)}
                    onMouseLeave={() => onHighlightLine?.(null)}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    {displayValue}
                  </motion.span>
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