import { useState, useEffect, useRef } from "react";
import CalculatorHeader from "@/components/CalculatorHeader";
import CalculatorFooter from "@/components/CalculatorFooter";
import EditorPanel, { LineWrapInfo } from "@/components/EditorPanel";
import ResultPanel from "@/components/ResultPanel";
import SettingsModal from "@/components/SettingsModal";
import { evaluate } from "@/lib/calculator";
import * as math from "mathjs";
import usePlatform from "@/hooks/use-platform";

// Welcome message text to show when app first loads
const WELCOME_MESSAGE = `// Welcome to Slide
// A powerful scientific calculator

// QUICK TUTORIAL:
2+3*4 // Basic Math
x = 10 // Variable Storage
y = 20
x+y // Use variables
sin(45 deg) // Trig
10 || 20 // Parallel resistors
100 inches to meters // Units
// Type below to begin.

`;

const Calculator = () => {
  const { isElectron } = usePlatform();
  const [content, setContent] = useState(WELCOME_MESSAGE);
  const [editorContent, setEditorContent] = useState(WELCOME_MESSAGE);
  const [results, setResults] = useState<(string | null)[]>([]);
  const [variables, setVariables] = useState<Record<string, any>>({});
  const [angleMode, setAngleMode] = useState<"DEG" | "RAD">("DEG");
  const [showSettings, setShowSettings] = useState(false);
  const [decimalPlaces, setDecimalPlaces] = useState(3);
  const [highlightedLine, setHighlightedLine] = useState<number | null>(null);
  const [wrapInfo, setWrapInfo] = useState<LineWrapInfo>({});

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const prevContentRef = useRef<string>(content);
  const prevCalculationStateRef = useRef<{ results: (string | null)[]; variables: Record<string, any> }>({ results: [], variables: {} });

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setContent(editorContent), 120);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [editorContent]);

  useEffect(() => {
    const lines = content.split("\n");
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
        const isIncompleteExpression =
          line.split("(").length !== line.split(")").length || // Unbalanced parentheses
          line.endsWith("+") ||
          line.endsWith("-") ||
          line.endsWith("*") ||
          line.endsWith("/") ||
          line.endsWith("^") ||
          line.endsWith("=") ||
          line.endsWith(" ") || // Ending with a space indicates typing in progress
          /\b(to|in)\s*$/i.test(line) || // Unit conversion operations in progress
          /\d+\s*[a-z]+$/i.test(line); // Unit specification in progress

        if (isIncompleteExpression) {
          // For incomplete expressions, just show nothing
          newResults.push(null);
          continue;
        }

        const { result, updatedVariables } = evaluate(
          line,
          newVariables,
          angleMode,
        );

        // Update variables with any new ones defined in this line
        Object.assign(newVariables, updatedVariables);

        // Format the result with the specified decimal places
        let formattedResult: string | null = null;
        if (result !== null && result !== undefined) {
          // Format all numeric results consistently
          if (typeof result === "number") {
            // Check if the number is close to an integer to fix scientific notation issues
            const isNearZero = Math.abs(result) < 1e-10;

            // Handle numbers very close to zero
            if (isNearZero) {
              formattedResult = "0";
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
              formattedResult = formattedResult.replace(/\.?0+$/, "");
              // If it's just a whole number, leave it as an integer
              if (formattedResult.endsWith(".")) {
                formattedResult = formattedResult.slice(0, -1);
              }
            }
          }
          // Handle unit conversions and other complex results
          else if (result && typeof result === "object" && result.toString) {
            // Try to extract numeric value from complex math.js objects
            try {
              const resultStr = result.toString();

              // Handle complex numbers (with imaginary parts)
              if (
                resultStr.includes("i") &&
                typeof result.re === "number" &&
                typeof result.im === "number"
              ) {
                // Format both real and imaginary parts with proper decimal places
                const realPart = Number(result.re.toFixed(decimalPlaces))
                  .toString()
                  .replace(/\.?0+$/, "");

                const imPart = Math.abs(
                  Number(result.im.toFixed(decimalPlaces)),
                );
                const imFormatted = imPart.toString().replace(/\.?0+$/, "");

                // Format like "3 + 2i" or "3 - 2i"
                if (imPart === 0) {
                  formattedResult = realPart;
                } else if (result.re === 0) {
                  // Fix for issues like 100*i showing as 1i
                  // Return the actual imaginary value (keeping full precision)
                  if (
                    line.includes("*i") ||
                    line.includes("* i") ||
                    line.includes("(i)")
                  ) {
                    // First check if we have a comment with the original expression
                    const commentMatch = line.match(/\/\/\s*originalExpr:(.+)/);
                    if (commentMatch && commentMatch[1]) {
                      // Extract the coefficient from the original expression
                      const origExpr = commentMatch[1].trim();
                      const coeffMatch = origExpr.match(
                        /(\d+(?:\.\d+)?)\s*\*\s*i/,
                      );
                      if (coeffMatch && coeffMatch[1]) {
                        formattedResult =
                          result.im < 0
                            ? `-${coeffMatch[1]}i`
                            : `${coeffMatch[1]}i`;
                      } else {
                        // Fallback to the normal extraction
                        const directCoeffMatch = line.match(
                          /(\d+(?:\.\d+)?)\s*[\*\(]\s*i/,
                        );
                        if (directCoeffMatch && directCoeffMatch[1]) {
                          formattedResult =
                            result.im < 0
                              ? `-${directCoeffMatch[1]}i`
                              : `${directCoeffMatch[1]}i`;
                        } else {
                          formattedResult =
                            result.im < 0
                              ? `-${imFormatted}i`
                              : `${imFormatted}i`;
                        }
                      }
                    } else {
                      // No comment, try to extract directly
                      const directCoeffMatch = line.match(
                        /(\d+(?:\.\d+)?)\s*[\*\(]\s*i/,
                      );
                      if (directCoeffMatch && directCoeffMatch[1]) {
                        formattedResult =
                          result.im < 0
                            ? `-${directCoeffMatch[1]}i`
                            : `${directCoeffMatch[1]}i`;
                      } else {
                        formattedResult =
                          result.im < 0
                            ? `-${imFormatted}i`
                            : `${imFormatted}i`;
                      }
                    }
                  } else {
                    formattedResult =
                      result.im < 0 ? `-${imFormatted}i` : `${imFormatted}i`;
                  }
                } else {
                  formattedResult = `${realPart} ${result.im < 0 ? "-" : "+"} ${imFormatted}i`;
                }
              }
              // Check if it's a unit conversion or other math.js object
              else if (resultStr.includes(" ") || /[a-zA-Z]/.test(resultStr)) {
                // For unit conversions, try to format the numeric part
                const numericPart = parseFloat(resultStr);
                if (!isNaN(numericPart)) {
                  // Format the numeric part with proper decimal places
                  const formattedNum = numericPart
                    .toFixed(decimalPlaces)
                    .replace(/\.?0+$/, "");

                  // Extract the unit part if it exists
                  const unitPart = resultStr.replace(/^[\d.\-+e]+/, "").trim();
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
        const isTypingError =
          errorMessage.includes("unexpected") ||
          errorMessage.includes("syntax") ||
          errorMessage.includes("unterminated") ||
          errorMessage.includes("unit") ||
          errorMessage.includes("convert") ||
          line.toLowerCase().includes(" to ") ||
          line.toLowerCase().includes(" in ");

        // Don't show any errors in the output panel
        newResults.push(null);
      }
    }

    setResults(newResults);
    setVariables(newVariables);
    prevContentRef.current = content;
    prevCalculationStateRef.current = { results: newResults, variables: newVariables };
  }, [content, angleMode, decimalPlaces]);

  const handleClear = () => {
    if (window.confirm("Are you sure you want to clear all calculations?")) {
      setEditorContent("");
      setContent("");
      setResults([]);
      setVariables({});
      prevContentRef.current = "";
      prevCalculationStateRef.current = { results: [], variables: {} };
    }
  };

  const handleExport = async () => {
    // Create a text file with content and results
    const lines = content.split("\n");
    const exportContent = lines
      .map((line, index) => {
        const result = results[index] ? results[index] : "";
        return `${line.padEnd(50)} ${result}`;
      })
      .join("\n");

    if (isElectron) {
      // In Electron, we can use the dialog API for a better native experience
      try {
        // Use the exposed electronAPI from preload script
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const defaultPath = `slide-export-${timestamp}.txt`;
        
        // Check if we have access to the Electron API
        if (window.electronAPI) {
          // Call the saveFile method exposed by our preload script
          const result = await window.electronAPI.saveFile(
            exportContent, 
            defaultPath
          );
          
          if (result && result.success) {
            console.log('File saved successfully to:', result.filePath);
            return; // Exit early as the file has been saved
          } else if (result && !result.success && result.reason === 'cancelled') {
            console.log('File save cancelled by user');
            return; // User cancelled, no need to fallback
          }
          // If we reach here, something went wrong with the Electron save
          console.warn('Electron save failed, falling back to browser download');
        } else {
          console.warn('Running in Electron but API not available, falling back to browser download');
        }
        
        // Fallback to browser download if Electron API is not available
        const blob = new Blob([exportContent], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = defaultPath;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error('Error using Electron save dialog:', err);
        
        // Fallback to browser download method if Electron save fails
        const blob = new Blob([exportContent], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "slide-export.txt";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } else {
      // Web browser download
      const blob = new Blob([exportContent], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "slide-export.txt";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const toggleAngleMode = () => {
    setAngleMode((prev) => (prev === "DEG" ? "RAD" : "DEG"));
  };

  // Calculate total lines based on the immediate editor content
  const totalLines = editorContent.split('\n').length;

  return (
    <div className="h-screen flex flex-col bg-[hsl(var(--editor-bg))] text-[hsl(var(--editor-text))] font-mono">
      <CalculatorHeader />
      
      <main className="flex-1 overflow-hidden flex">
        <div className="flex flex-row w-full h-full">
          <div className="w-[70%] h-full relative flex-shrink-0">
            <EditorPanel
              content={editorContent}
              onChange={setEditorContent}
              highlightedLine={highlightedLine}
              onWrapInfoChange={setWrapInfo}
            />
          </div>

          <div className="flex-1 w-[30%] h-full overflow-y-auto">
            <ResultPanel
              results={results}
              onHighlightLine={setHighlightedLine}
              wrapInfo={wrapInfo}
            />
          </div>
        </div>
      </main>

      <CalculatorFooter
        angleMode={angleMode}
        toggleAngleMode={toggleAngleMode}
        onExport={handleExport}
        onShowSettings={() => setShowSettings(true)}
        onClear={handleClear}
        totalLines={totalLines}
      />

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
