import * as math from 'mathjs';

// Create a custom math.js instance
const mathInstance = math.create(math.all);

// Configure mathjs for precision calculations
mathInstance.config({
  number: 'number', 
  precision: 14
});

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
  // Skip comments
  if (expression.trim().startsWith('//')) {
    return { result: null, updatedVariables: {} };
  }

  // Extract comment if any
  const commentSplit = expression.split('//');
  const actualExpression = commentSplit[0].trim();
  
  if (!actualExpression) {
    return { result: null, updatedVariables: {} };
  }
  
  // Pre-process expression to handle special syntax
  const processed = preprocessExpression(actualExpression, angleMode);
  
  // Prepare scope with variables and constants
  const scope = prepareScope(variables, angleMode);

  // Handle special cases for calculations
  const specialCase = handleSpecialCases(processed, scope, angleMode);
  if (specialCase) {
    return specialCase;
  }
  
  // Handle variable assignment
  const assignmentMatch = processed.match(/^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$/);
  if (assignmentMatch) {
    const [, variableName, valueExpression] = assignmentMatch;
    
    try {
      const value = mathInstance.evaluate(valueExpression, scope);
      return {
        result: value,
        updatedVariables: { [variableName]: value }
      };
    } catch (error) {
      return { 
        result: `Error: ${(error as Error).message}`, 
        updatedVariables: {} 
      };
    }
  }
  
  // Regular expression evaluation
  try {
    const result = mathInstance.evaluate(processed, scope);
    return { result, updatedVariables: {} };
  } catch (error) {
    // If it's a complex expression that failed, try fallback approaches
    const fallbackResult = tryFallbackApproaches(processed, scope, error as Error);
    if (fallbackResult) {
      return fallbackResult;
    }
    
    return { 
      result: `Error: ${(error as Error).message}`, 
      updatedVariables: {} 
    };
  }
}

/**
 * Pre-process an expression to handle special syntax like unit conversions,
 * complex numbers, and angle-based functions
 */
function preprocessExpression(expression: string, angleMode: 'DEG' | 'RAD'): string {
  let processed = expression;
  
  // Process unit-related expressions
  processed = processUnitNames(processed);
  
  // Process complex number expressions
  processed = processComplexNumbers(processed);
  
  // Process angle-specific notations
  processed = processDegreeNotation(processed, angleMode);
  
  return processed;
}

/**
 * Process unit names in the expression, handling 'in' unit correctly
 */
function processUnitNames(expression: string): string {
  let processed = expression;
  
  // Replace 'in' unit with 'inch' to avoid JavaScript keyword issues
  processed = processed.replace(/(\d+(\.\d+)?)\s+in\b/g, '$1 inch');
  processed = processed.replace(/\bin\s+to\s+/gi, 'inch to ');
  processed = processed.replace(/\bto\s+in\b/gi, 'to inch');
  processed = processed.replace(/\bin\s*[\*\+\-\/\^]/gi, 'inch$&');
  processed = processed.replace(/[\*\+\-\/\^]\s*in\b/gi, '$&inch');
  
  return processed;
}

/**
 * Process complex number notation, ensuring correct syntax for i
 */
function processComplexNumbers(expression: string): string {
  let processed = expression;
  
  // Handle compact notation: 10i → 10*i
  processed = processed.replace(/(\d+(\.\d+)?)i\b/g, '$1*i');
  
  // Prevent "icos" by adding a multiplication symbol: i cos → i*cos
  processed = processed.replace(/\bi\s*([a-zA-Z])/gi, 'i*$1');
  
  // Handle Euler's identity: e^(i*pi) → -1
  processed = processed.replace(/e\^\s*\(\s*i\s*\*\s*pi\s*\)/gi, '(-1)');
  processed = processed.replace(/e\^i\s*\*\s*pi/gi, '(-1)');
  
  // Ensure parentheses for complex powers: (1+i)^2
  processed = processed.replace(/\(([^()]*i[^()]*)\)\s*\^\s*(\d+)/g, 'pow($1,$2)');
  
  return processed;
}

/**
 * Process degree-related notation: sin(45 deg)
 */
function processDegreeNotation(expression: string, angleMode: 'DEG' | 'RAD'): string {
  let processed = expression;
  
  // Handle sin(45 deg) notation - replace with sin(deg(45))
  const degPattern = /\b(sin|cos|tan|arcsin|arccos|arctan|asin|acos|atan)\s*\(\s*([^()]*?)\s+deg\s*\)/gi;
  processed = processed.replace(degPattern, '$1(deg($2))');
  
  return processed;
}

/**
 * Prepare the evaluation scope with variables and math functions
 */
function prepareScope(variables: Record<string, any>, angleMode: 'DEG' | 'RAD'): Record<string, any> {
  const scope: Record<string, any> = { ...variables };
  
  // Add constants
  scope.pi = Math.PI;
  scope.e = Math.E;
  
  // Add complex number support
  scope.i = math.complex(0, 1);
  
  // Add conversion functions
  scope.deg2rad = (deg: number) => deg * Math.PI / 180;
  scope.rad2deg = (rad: number) => rad * 180 / Math.PI;
  
  // Function to interpret degrees
  scope.deg = (x: number) => (angleMode === 'RAD') ? x * Math.PI / 180 : x;
  
  if (angleMode === 'DEG') {
    // Override trigonometric functions to work in degrees
    scope.sin = (x: number) => Math.sin(x * Math.PI / 180);
    scope.cos = (x: number) => Math.cos(x * Math.PI / 180);
    scope.tan = (x: number) => {
      // Special case for tan of multiples of 90°
      if (Math.abs(x % 180 - 90) < 1e-10) {
        return Infinity;
      }
      return Math.tan(x * Math.PI / 180);
    };
    
    // Override inverse trigonometric functions to return degrees
    scope.asin = scope.arcsin = (x: number) => Math.asin(x) * 180 / Math.PI;
    scope.acos = scope.arccos = (x: number) => Math.acos(x) * 180 / Math.PI;
    scope.atan = scope.arctan = (x: number) => Math.atan(x) * 180 / Math.PI;
  }
  
  return scope;
}

/**
 * Handle special calculation cases like unit conversions
 */
function handleSpecialCases(
  expression: string, 
  scope: Record<string, any>,
  angleMode: 'DEG' | 'RAD'
): { result: any; updatedVariables: Record<string, any> } | null {
  
  // Check for unit conversion syntax: "10 m to in"
  if (/\d+(\.\d+)?\s+\w+\s+to\s+\w+/.test(expression)) {
    try {
      const result = mathInstance.evaluate(expression);
      return { result, updatedVariables: {} };
    } catch (error) {
      return { result: `Error: ${(error as Error).message}`, updatedVariables: {} };
    }
  }
  
  // Check for direct unit calculations: "10 inch * 5 m"
  if (/\d+(\.\d+)?\s+\w+\s*[\*\+\-\/]\s*\d+(\.\d+)?\s+\w+/.test(expression)) {
    try {
      const result = mathInstance.evaluate(expression);
      return { result, updatedVariables: {} };
    } catch (error) {
      return { result: `Error: ${(error as Error).message}`, updatedVariables: {} };
    }
  }
  
  // Check for variable with unit: "x in" or "x m"
  const variableUnitMatch = expression.match(/^([a-zA-Z][a-zA-Z0-9]*)\s+([a-zA-Z]+)$/);
  if (variableUnitMatch && scope[variableUnitMatch[1]] !== undefined) {
    const [, varName, unitName] = variableUnitMatch;
    const varValue = scope[varName];
    
    try {
      // Create unit expression and evaluate
      const result = mathInstance.evaluate(`${varValue} ${unitName}`);
      return { result, updatedVariables: {} };
    } catch (error) {
      // Fall through to regular evaluation
    }
  }
  
  // Special case for Euler's identity and related formulas
  if (/e\^i/i.test(expression)) {
    try {
      // Direct evaluation of e^i
      if (expression.trim() === 'e^i') {
        // e^i = cos(1) + i*sin(1)
        const cosVal = angleMode === 'DEG' ? Math.cos(1 * Math.PI / 180) : Math.cos(1);
        const sinVal = angleMode === 'DEG' ? Math.sin(1 * Math.PI / 180) : Math.sin(1);
        
        return {
          result: math.complex(cosVal, sinVal),
          updatedVariables: {}
        };
      }
      
      // Try to evaluate using Euler's formula
      const eulerPattern = /e\^i\s*\*\s*([^+\-*/^)]+)/;
      const match = expression.match(eulerPattern);
      if (match) {
        const [, exponent] = match;
        let value: number;
        
        try {
          // Evaluate the exponent
          value = Number(mathInstance.evaluate(exponent, scope));
          
          // Apply Euler's formula: e^(i*θ) = cos(θ) + i*sin(θ)
          const cosVal = angleMode === 'DEG' ? Math.cos(value * Math.PI / 180) : Math.cos(value);
          const sinVal = angleMode === 'DEG' ? Math.sin(value * Math.PI / 180) : Math.sin(value);
          
          return {
            result: math.complex(cosVal, sinVal),
            updatedVariables: {}
          };
        } catch (e) {
          // Continue with normal evaluation
        }
      }
    } catch (error) {
      // Fall through to regular evaluation
    }
  }
  
  return null;
}

/**
 * Try alternative approaches for problematic expressions
 */
function tryFallbackApproaches(
  expression: string, 
  scope: Record<string, any>, 
  error: Error
): { result: any; updatedVariables: Record<string, any> } | null {
  
  // Check if it's a complex number issue
  if (expression.includes('i') && 
      (error.message.includes('unexpected') || error.message.includes('parenthesis'))) {
    
    try {
      // Try complex number direct construction
      if (/\d+\s*\+\s*\d+i/.test(expression)) {
        const parts = expression.match(/(\d+(\.\d+)?)\s*\+\s*(\d+(\.\d+)?)\s*i/);
        if (parts) {
          const [, real, , imaginary] = parts;
          return { 
            result: math.complex(Number(real), Number(imaginary)), 
            updatedVariables: {} 
          };
        }
      }
      
      // Try complex multiplication
      if (/\d+i\s*\*\s*\d+/.test(expression) || /\d+\s*\*\s*\d+i/.test(expression)) {
        // Extract the numeric parts
        const match = expression.match(/(\d+(\.\d+)?)\s*\*\s*(\d+(\.\d+)?)i/) || 
                     expression.match(/(\d+(\.\d+)?)i\s*\*\s*(\d+(\.\d+)?)/);
        
        if (match) {
          const num1 = Number(match[1]);
          const num2 = Number(match[3] || match[1]);
          
          // i * number = number * i = number*i
          return { 
            result: math.complex(0, num1 * num2), 
            updatedVariables: {} 
          };
        }
      }
      
      // Try different formula for powers of i
      if (/i\s*\^\s*\d+/.test(expression)) {
        const match = expression.match(/i\s*\^\s*(\d+)/);
        if (match) {
          const power = Number(match[1]);
          
          // i^0 = 1, i^1 = i, i^2 = -1, i^3 = -i, i^4 = 1, ...
          const remainder = power % 4;
          
          if (remainder === 0) return { result: 1, updatedVariables: {} };
          if (remainder === 1) return { result: math.complex(0, 1), updatedVariables: {} };
          if (remainder === 2) return { result: -1, updatedVariables: {} };
          if (remainder === 3) return { result: math.complex(0, -1), updatedVariables: {} };
        }
      }
    } catch (fallbackError) {
      // Continue with next fallback
    }
    
    // Fallback for expressions with i where mathjs fails
    try {
      // Replace expression to use complex() function
      let modified = expression;
      
      // Convert a+bi → complex(a,b)
      modified = modified.replace(/(\d+(\.\d+)?)\s*\+\s*(\d+(\.\d+)?)\s*i/g, 'complex($1,$3)');
      modified = modified.replace(/(\d+(\.\d+)?)\s*\-\s*(\d+(\.\d+)?)\s*i/g, 'complex($1,-$3)');
      
      // Add complex() function to scope
      scope.complex = math.complex;
      
      // Try evaluation with modified expression
      const result = mathInstance.evaluate(modified, scope);
      return { result, updatedVariables: {} };
    } catch (complexError) {
      // Continue with final fallback
    }
  }
  
  return null;
}