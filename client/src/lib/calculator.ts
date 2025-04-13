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
  
  // Handle imaginary unit (i) in any position
  const processedExpression = prepareForEvaluation(actualExpression);
  
  // Create a scope with current variables
  const scope = { ...variables };
  
  // Add constants
  scope.pi = Math.PI;
  scope.e = Math.E;
  
  // Add trig functions that respect the angle mode
  setupTrigFunctions(scope, angleMode);
  
  // Check for unit handling: "10 m to in" pattern
  if (/\d+(\.\d+)?\s+\w+\s+to\s+\w+/.test(processedExpression)) {
    try {
      const result = evaluateUnitConversion(processedExpression);
      return { result, updatedVariables: {} };
    } catch (error) {
      return { result: `Error: ${(error as Error).message}`, updatedVariables: {} };
    }
  }
  
  // Check for direct unit calculation "10 in * 10 m"
  const unitOperationMatch = processedExpression.match(/(\d+(\.\d+)?)\s+(\w+)\s*[\*\+\-\/]\s*(\d+(\.\d+)?)\s+(\w+)/);
  if (unitOperationMatch) {
    try {
      // Handle 'in' keyword
      let processed = processedExpression.replace(/\bin\b/g, 'inch');
      const result = mathInstance.evaluate(processed);
      return { result, updatedVariables: {} };
    } catch (error) {
      return { result: `Error: ${(error as Error).message}`, updatedVariables: {} };
    }
  }
  
  // Check for variable with unit: "x in"
  const variableUnitMatch = processedExpression.match(/^([a-zA-Z][a-zA-Z0-9]*)\s+([a-zA-Z]+)$/);
  if (variableUnitMatch && variables[variableUnitMatch[1]] !== undefined) {
    const [, varName, unitName] = variableUnitMatch;
    const varValue = variables[varName];
    
    try {
      const unitExpr = unitName.toLowerCase() === 'in' 
        ? `${varValue} inch` 
        : `${varValue} ${unitName}`;
      
      const result = mathInstance.evaluate(unitExpr);
      return { result, updatedVariables: {} };
    } catch (error) {
      // Fall through to normal evaluation
    }
  }
  
  // Handle variable assignment
  const assignmentMatch = processedExpression.match(/^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$/);
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
    const result = mathInstance.evaluate(processedExpression, scope);
    return { result, updatedVariables: {} };
  } catch (error) {
    // Handle special cases for math errors
    const errorMessage = (error as Error).message;
    
    // Try fallback approaches for known edge cases
    if (errorMessage.includes('unexpected operator')) {
      try {
        // Try with parentheses for complex number expressions
        const result = handleComplexExpression(processedExpression, scope);
        if (result !== undefined) {
          return { result, updatedVariables: {} };
        }
      } catch (innerError) {
        // Fall through to generic error
      }
    }
    
    return { 
      result: `Error: ${errorMessage}`, 
      updatedVariables: {} 
    };
  }
}

/**
 * Prepare an expression for evaluation by replacing unit names and handling
 * complex numbers with imaginary unit i
 */
function prepareForEvaluation(expression: string): string {
  let processed = expression;
  
  // Replace 'in' unit with 'inch'
  processed = processed.replace(/(\d+(\.\d+)?)\s+in\b/g, '$1 inch');
  processed = processed.replace(/\bin\s+to\s+/gi, 'inch to ');
  processed = processed.replace(/\bto\s+in\b/gi, 'to inch');
  
  // Ensure proper imaginary number i formatting
  processed = processed.replace(/(\d+)i/g, '$1*i');
  
  // Make sure "sin(90) + i*cos(90)" works but not "sin(90) + icos(90)"
  processed = processed.replace(/\bi\s*([a-z])/gi, 'i*$1');
  
  return processed;
}

/**
 * Add trigonometric functions to scope that respect the angle mode
 */
function setupTrigFunctions(scope: Record<string, any>, angleMode: 'DEG' | 'RAD'): void {
  // Define the complex imaginary unit for calculations
  scope.i = math.complex(0, 1);
  
  // Conversion functions always available
  scope.deg2rad = (deg: number) => deg * Math.PI / 180;
  scope.rad2deg = (rad: number) => rad * 180 / Math.PI;
  
  if (angleMode === 'DEG') {
    // Add degree-based trigonometric functions
    scope.sin = (x: number) => Math.sin(x * Math.PI / 180);
    scope.cos = (x: number) => Math.cos(x * Math.PI / 180);
    scope.tan = (x: number) => {
      // Special case for tan(90) and similar angles
      if (Math.abs(Math.abs(x % 180) - 90) < 1e-10) {
        return Infinity;
      }
      return Math.tan(x * Math.PI / 180);
    };
    
    // Inverse trigonometric functions return degrees
    scope.asin = scope.arcsin = (x: number) => Math.asin(x) * 180 / Math.PI;
    scope.acos = scope.arccos = (x: number) => Math.acos(x) * 180 / Math.PI;
    scope.atan = scope.arctan = (x: number) => Math.atan(x) * 180 / Math.PI;
    
    // Make the deg() function process values as degrees
    scope.deg = (x: number) => x;
  } else {
    // In RAD mode, ensure deg() function still works by converting from degrees to radians
    scope.deg = (x: number) => x * Math.PI / 180;
  }
}

/**
 * Handle unit conversions properly
 */
function evaluateUnitConversion(expression: string): any {
  // Replace 'in' with 'inch' to avoid JS keyword issues
  const processedExpr = expression.replace(/\bin\b/g, 'inch');
  
  // Try to evaluate the unit conversion
  return mathInstance.evaluate(processedExpr);
}

/**
 * Handle complex expressions with the imaginary unit i
 */
function handleComplexExpression(expression: string, scope: Record<string, any>): any {
  // Replace complex imaginary numbers for direct evaluation
  let processedExpr = expression;
  
  // Try different approaches for complex number handling
  
  // First attempt: Direct complex number construction
  if (expression.includes('i')) {
    try {
      return mathInstance.evaluate(processedExpr, scope);
    } catch (e) {
      // Continue to next approach
    }
  }
  
  // Second attempt: For expressions like (1+i)^2, try adding parentheses
  if (expression.includes('i') && expression.includes('^')) {
    processedExpr = expression.replace(/\(([^)]*i[^)]*)\)(\^)/g, 'pow($1,$2');
    try {
      return mathInstance.evaluate(processedExpr, scope);
    } catch (e) {
      // Continue to next approach
    }
  }
  
  // Third attempt: For expressions with e^i
  if (expression.includes('e^i') || expression.includes('e^(i')) {
    try {
      // Replace e^i with Euler's formula: cos(1) + i*sin(1)
      processedExpr = expression.replace(/e\^i/g, '(cos(1) + i*sin(1))');
      processedExpr = expression.replace(/e\^\(i\*([^)]+)\)/g, '(cos($1) + i*sin($1))');
      return mathInstance.evaluate(processedExpr, scope);
    } catch (e) {
      // Continue to final error
    }
  }
  
  throw new Error('Could not evaluate complex expression');
}