import * as math from 'mathjs';

// Create a custom math.js instance with configuration
const mathInstance = math.create(math.all);

// Configure math.js with complex number support and implicit multiplication
// @ts-ignore - 'implicit' is a valid option in mathjs but TypeScript doesn't know about it
mathInstance.config({
  number: 'number',
  precision: 14,
  implicit: 'show'  // Enable implicit multiplication
});

// Define the imaginary unit properly
mathInstance.evaluate('i = complex(0, 1)');

// Some constants we need
const PI = Math.PI;
const DEG_TO_RAD = PI / 180;
const RAD_TO_DEG = 180 / PI;

/**
 * Evaluates a mathematical expression
 * @param expression The expression to evaluate
 * @param variables Current variables object
 * @param angleMode Current angle mode (DEG or RAD)
 * @returns The result and any updated variables
 */
export function evaluate(
  expression: string,
  variables: Record<string, any> = {},
  angleMode: 'DEG' | 'RAD' = 'DEG'
): { result: any; updatedVariables: Record<string, any> } {
  try {
    // 1. Strip comments
    const expr = expression.split('//')[0].trim();
    if (!expr) return { result: null, updatedVariables: {} };
    
    // 2. Create scope with the right angle mode
    const scope: Record<string, any> = { ...variables };
    
    // Add important constants and complex number support
    scope.PI = PI;
    scope.pi = PI;
    scope.e = Math.E;
    scope.i = mathInstance.evaluate('complex(0, 1)');
    
    // Configure trig functions based on angle mode
    if (angleMode === 'DEG') {
      // In DEG mode, override trig functions to work with degrees
      scope.sin = (x: number) => Math.sin(x * DEG_TO_RAD);
      scope.cos = (x: number) => Math.cos(x * DEG_TO_RAD);
      scope.tan = (x: number) => Math.tan(x * DEG_TO_RAD);
      scope.asin = (x: number) => Math.asin(x) * RAD_TO_DEG;
      scope.acos = (x: number) => Math.acos(x) * RAD_TO_DEG;
      scope.atan = (x: number) => Math.atan(x) * RAD_TO_DEG;
      
      // Also add aliases
      scope.arcsin = scope.asin;
      scope.arccos = scope.acos;
      scope.arctan = scope.atan;
    }
    
    // 3. Check for variable assignment
    const assign = expr.match(/^\s*([a-zA-Z_]\w*)\s*=\s*(.+)$/);
    if (assign) {
      const [, name, rhs] = assign;
      const value = mathInstance.evaluate(rhs, scope);
      return { result: value, updatedVariables: { [name]: value } };
    }
    
    // 4. Handle unit conversion (works with spaces)
    if (expr.toLowerCase().includes(' to ')) {
      try {
        const result = mathInstance.evaluate(expr, scope);
        return { result: result.toString(), updatedVariables: {} };
      } catch (error) {
        // Fall through to regular evaluation
      }
    }
    
    // 5. Regular evaluation with implicit multiplication
    const result = mathInstance.evaluate(expr, scope);
    return { result, updatedVariables: {} };
  } catch (error) {
    // Return null for any top-level errors
    console.error("Evaluation error:", error);
    return { result: null, updatedVariables: {} };
  }
}

/**
 * Helper function to convert non-breaking spaces to regular spaces
 */
function handleSpaces(expression: string): string {
  // Convert any non-breaking spaces to regular spaces and normalize spacing
  return expression.replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim();
}