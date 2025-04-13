import { useState, useEffect } from 'react';
import CalculatorHeader from "@/components/CalculatorHeader";
import CalculatorFooter from "@/components/CalculatorFooter";
import EditorPanel from "@/components/EditorPanel";
import ResultPanel from "@/components/ResultPanel";
import HelpModal from "@/components/HelpModal";
import { evaluate } from "@/lib/calculator";

const Calculator = () => {
  const [content, setContent] = useState('');
  const [results, setResults] = useState<(string | null)[]>([]);
  const [variables, setVariables] = useState<Record<string, any>>({});
  const [angleMode, setAngleMode] = useState<'DEG' | 'RAD'>('DEG');
  const [showHelp, setShowHelp] = useState(false);
  
  // Calculate results whenever content or angle mode changes
  useEffect(() => {
    const lines = content.split('\n');
    const newResults: (string | null)[] = [];
    const newVariables = { ...variables };
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!line) {
        newResults.push(null);
        continue;
      }
      
      try {
        const { result, updatedVariables } = evaluate(line, newVariables, angleMode);
        
        // Update variables with any new ones defined in this line
        Object.assign(newVariables, updatedVariables);
        
        // Add the result
        newResults.push(result !== undefined ? String(result) : null);
      } catch (error) {
        newResults.push(`Error: ${(error as Error).message}`);
      }
    }
    
    setResults(newResults);
    setVariables(newVariables);
  }, [content, angleMode]);
  
  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear all calculations?')) {
      setContent('');
      setResults([]);
      setVariables({});
    }
  };
  
  const handleExport = () => {
    // Create a text file with content and results
    const lines = content.split('\n');
    const exportContent = lines.map((line, index) => {
      const result = results[index] ? results[index] : '';
      return `${line.padEnd(50)} ${result}`;
    }).join('\n');
    
    const blob = new Blob([exportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bitwise-export.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const toggleAngleMode = () => {
    setAngleMode(prev => prev === 'DEG' ? 'RAD' : 'DEG');
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-[hsl(var(--editor-bg))] text-[hsl(var(--editor-text))] font-mono">
      <CalculatorHeader 
        angleMode={angleMode}
        toggleAngleMode={toggleAngleMode}
        onShowHelp={() => setShowHelp(true)}
      />
      
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <EditorPanel content={content} onChange={setContent} />
        <ResultPanel results={results} />
      </main>
      
      <CalculatorFooter 
        variableCount={Object.keys(variables).length}
        angleMode={angleMode}
        onClear={handleClear}
        onExport={handleExport}
      />
      
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  );
};

export default Calculator;
