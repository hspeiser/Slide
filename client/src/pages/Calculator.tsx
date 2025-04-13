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
  const [highlightedLine, setHighlightedLine] = useState<number | null>(null);
  
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
        // Don't show errors for incomplete expressions
        // Check if the expression is incomplete (common cases like missing closing parenthesis)
        const isIncompleteExpression = (
          (line.split('(').length !== line.split(')').length) || // Unbalanced parentheses
          line.endsWith('+') || line.endsWith('-') || 
          line.endsWith('*') || line.endsWith('/') ||
          line.endsWith('^') || line.endsWith('=') ||
          line.endsWith(' ') || // Ending with a space indicates typing in progress
          /\b(to|in)\s*$/i.test(line) || // Unit conversion operations in progress
          /\d+\s*[a-z]+$/i.test(line) // Unit specification in progress
        );
        
        if (isIncompleteExpression) {
          // For incomplete expressions, just show nothing
          newResults.push(null);
          continue;
        }
        
        const { result, updatedVariables } = evaluate(line, newVariables, angleMode);
        
        // Update variables with any new ones defined in this line
        Object.assign(newVariables, updatedVariables);
        
        // Format the result with the specified decimal places
        let formattedResult: string | null = null;
        if (result !== null && result !== undefined) {
          // Format all numeric results consistently
          if (typeof result === 'number') {
            // Check if the number is close to an integer to fix scientific notation issues
            const isNearZero = Math.abs(result) < 1e-10;
            
            // Handle numbers very close to zero
            if (isNearZero) {
              formattedResult = '0';
            } 
            // Handle trig functions returning values very close to 0, 1, or -1
            else if (Math.abs(result - Math.round(result)) < 1e-10) {
              formattedResult = String(Math.round(result));
            }
            // Handle other numbers within the precision limits
            else {
              // Use fixed notation for consistent decimal display
              formattedResult = result.toFixed(decimalPlaces);
              // Remove trailing zeros
              formattedResult = formattedResult.replace(/\.?0+$/, '');
              // If it's just a whole number, leave it as an integer
              if (formattedResult.endsWith('.')) {
                formattedResult = formattedResult.slice(0, -1);
              }
            }
          } 
          // Handle unit conversions and other complex results
          else if (result && typeof result === 'object' && result.toString) {
            // Try to extract numeric value from complex math.js objects
            try {
              const resultStr = result.toString();
              
              // Handle complex numbers (with imaginary parts)
              if (resultStr.includes('i') && typeof result.re === 'number' && typeof result.im === 'number') {
                // Format both real and imaginary parts with proper decimal places
                const realPart = Number(result.re.toFixed(decimalPlaces)).toString()
                  .replace(/\.?0+$/, '');
                
                const imPart = Math.abs(Number(result.im.toFixed(decimalPlaces)));
                const imFormatted = imPart.toString().replace(/\.?0+$/, '');
                
                // Format like "3 + 2i" or "3 - 2i"
                if (imPart === 0) {
                  formattedResult = realPart;
                } else if (result.re === 0) {
                  // Fix for issues like 100*i showing as 1i
                  // Return the actual imaginary value (keeping full precision)
                  if (line.includes('*i') || line.includes('* i') || line.includes('(i)')) {
                    // First check if we have a comment with the original expression
                    const commentMatch = line.match(/\/\/\s*originalExpr:(.+)/);
                    if (commentMatch && commentMatch[1]) {
                      // Extract the coefficient from the original expression
                      const origExpr = commentMatch[1].trim();
                      const coeffMatch = origExpr.match(/(\d+(?:\.\d+)?)\s*\*\s*i/);
                      if (coeffMatch && coeffMatch[1]) {
                        formattedResult = result.im < 0 ? `-${coeffMatch[1]}i` : `${coeffMatch[1]}i`;
                      } else {
                        // Fallback to the normal extraction
                        const directCoeffMatch = line.match(/(\d+(?:\.\d+)?)\s*[\*\(]\s*i/);
                        if (directCoeffMatch && directCoeffMatch[1]) {
                          formattedResult = result.im < 0 ? `-${directCoeffMatch[1]}i` : `${directCoeffMatch[1]}i`;
                        } else {
                          formattedResult = result.im < 0 ? `-${imFormatted}i` : `${imFormatted}i`;
                        }
                      }
                    } else {
                      // No comment, try to extract directly
                      const directCoeffMatch = line.match(/(\d+(?:\.\d+)?)\s*[\*\(]\s*i/);
                      if (directCoeffMatch && directCoeffMatch[1]) {
                        formattedResult = result.im < 0 ? `-${directCoeffMatch[1]}i` : `${directCoeffMatch[1]}i`;
                      } else {
                        formattedResult = result.im < 0 ? `-${imFormatted}i` : `${imFormatted}i`;
                      }
                    }
                  } else {
                    formattedResult = result.im < 0 ? `-${imFormatted}i` : `${imFormatted}i`;
                  }
                } else {
                  formattedResult = `${realPart} ${result.im < 0 ? '-' : '+'} ${imFormatted}i`;
                }
              }
              // Check if it's a unit conversion or other math.js object
              else if (resultStr.includes(' ') || /[a-zA-Z]/.test(resultStr)) {
                // For unit conversions, try to format the numeric part
                const numericPart = parseFloat(resultStr);
                if (!isNaN(numericPart)) {
                  // Format the numeric part with proper decimal places
                  const formattedNum = numericPart.toFixed(decimalPlaces)
                    .replace(/\.?0+$/, '');
                  
                  // Extract the unit part if it exists
                  const unitPart = resultStr.replace(/^[\d.\-+e]+/, '').trim();
                  formattedResult = formattedNum + unitPart;
                } else {
                  formattedResult = resultStr;
                }
              } else {
                formattedResult = resultStr;
              }
            } catch (e) {
              formattedResult = String(result);
            }
          } else {
            formattedResult = String(result);
          }
        }
        
        // Add the result
        newResults.push(formattedResult);
      } catch (error) {
        // Don't show errors for simple syntax issues that occur during typing
        const errorMessage = (error as Error).message.toLowerCase();
        const isTypingError = errorMessage.includes('unexpected') || 
                             errorMessage.includes('syntax') ||
                             errorMessage.includes('unterminated') ||
                             errorMessage.includes('unit') ||
                             errorMessage.includes('convert') ||
                             line.toLowerCase().includes(' to ') ||
                             line.toLowerCase().includes(' in ');
                             
        // Don't show any errors in the output panel
        newResults.push(null);
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
        <div className="md:w-2/3 flex-grow h-full">
          <EditorPanel 
            content={content} 
            onChange={setContent} 
            highlightedLine={highlightedLine}
          />
        </div>
        <div className="md:w-1/3 h-full flex-shrink-0 md:max-w-xs lg:max-w-sm">
          <ResultPanel 
            results={results} 
            onHighlightLine={setHighlightedLine}
          />
        </div>
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
