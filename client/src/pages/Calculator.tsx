import { useState, useEffect } from 'react';
import CalculatorHeader from "@/components/CalculatorHeader";
import CalculatorFooter from "@/components/CalculatorFooter";
import EditorPanel from "@/components/EditorPanel";
import ResultPanel from "@/components/ResultPanel";
import HelpModal from "@/components/HelpModal";
import SettingsModal from "@/components/SettingsModal";
import { evaluate } from "@/lib/calculator";
import * as math from 'mathjs';

const Calculator = () => {
  const [content, setContent] = useState('');
  const [results, setResults] = useState<(string | null)[]>([]);
  const [variables, setVariables] = useState<Record<string, any>>({});
  const [angleMode, setAngleMode] = useState<'DEG' | 'RAD'>('DEG');
  const [showHelp, setShowHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [decimalPlaces, setDecimalPlaces] = useState(5);
  
  // Calculate results whenever content, angle mode, or decimal places change
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
        
        // Format the result with the specified decimal places
        let formattedResult: string | null = null;
        if (result !== null && result !== undefined) {
          if (typeof result === 'number') {
            formattedResult = math.format(result, { precision: decimalPlaces });
          } else {
            formattedResult = String(result);
          }
        }
        
        // Add the result
        newResults.push(formattedResult);
      } catch (error) {
        newResults.push(`Error: ${(error as Error).message}`);
      }
    }
    
    setResults(newResults);
    setVariables(newVariables);
  }, [content, angleMode, decimalPlaces]);
  
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
        onShowSettings={() => setShowSettings(true)}
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
      {showSettings && (
        <SettingsModal 
          onClose={() => setShowSettings(false)} 
          decimalPlaces={decimalPlaces}
          onDecimalPlacesChange={setDecimalPlaces}
        />
      )}
    </div>
  );
};

export default Calculator;
