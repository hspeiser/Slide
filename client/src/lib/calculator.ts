import * as math from 'mathjs';

// Create a custom math.js instance with configuration
const mathInstance = math.create(math.all);

// Configure math.js with default settings
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
  
  // Create a scope with current variables
  const scope = { ...variables };
  
  // Add useful constants
  scope.pi = Math.PI;
  scope.e = Math.E;
  scope.i = math.complex(0, 1); // Imaginary unit
  
  // Add angle conversion functions
  scope.deg2rad = function(deg: number) { return deg * Math.PI / 180; };
  scope.rad2deg = function(rad: number) { return rad * 180 / Math.PI; };
  
  // Add trigonometric functions that respect the angle mode
  if (angleMode === 'DEG') {
    // Override trig functions to work in degrees
    scope.sin = function(x: number) { return Math.sin(x * Math.PI / 180); };
    scope.cos = function(x: number) { return Math.cos(x * Math.PI / 180); };
    scope.tan = function(x: number) { 
      // Handle special case for tan(90) and tan(270) in degrees
      if (Math.abs(x % 180) === 90) return Infinity;
      return Math.tan(x * Math.PI / 180); 
    };
    
    // Inverse trig functions (return degrees)
    scope.asin = scope.arcsin = function(x: number) { return Math.asin(x) * 180 / Math.PI; };
    scope.acos = scope.arccos = function(x: number) { return Math.acos(x) * 180 / Math.PI; };
    scope.atan = scope.arctan = function(x: number) { return Math.atan(x) * 180 / Math.PI; };
  }

  // Check if this is unit conversion syntax (e.g., "10 m to in", "5 kg to lbs")
  if (/\d+(\.\d+)?\s+\w+\s+to\s+\w+/.test(actualExpression)) {
    try {
      // Handle the 'in' keyword which is a reserved word in javascript
      let processedExpr = actualExpression.replace(/\bin\b(?!\w)/g, 'inch');
      
      // Let mathjs handle the conversion
      const result = mathInstance.evaluate(processedExpr);
      return { result, updatedVariables: {} };
    } catch (error) {
      return { 
        result: `Error: ${(error as Error).message}`, 
        updatedVariables: {} 
      };
    }
  }
  
  // Check if this is adding units to a variable (e.g., "x in" or "x m")
  const variableUnitMatch = actualExpression.match(/^([a-zA-Z][a-zA-Z0-9]*)\s+([a-zA-Z]+)$/);
  if (variableUnitMatch && Object.keys(variables).includes(variableUnitMatch[1])) {
    const [, varName, unitName] = variableUnitMatch;
    const varValue = variables[varName];
    
    try {
      // Create unit value from the variable - handle 'in' special case
      const unitExpr = unitName.toLowerCase() === 'in' 
        ? `${varValue} inch` 
        : `${varValue} ${unitName}`;
      
      // Let mathjs handle the unit conversion
      const result = mathInstance.evaluate(unitExpr);
      return { result, updatedVariables: {} };
    } catch (error) {
      // Fall through to regular evaluation
    }
  }
  
  // Check for unit calculations (e.g., "10 m * 5")
  try {
    // Handle inch keyword by temporarily replacing it
    let processedExpr = actualExpression.replace(/\bin\b(?!\w)/g, 'inch');
    
    // Check if the expression contains unit names
    const hasUnits = /[0-9.]\s*[a-zA-Z]+/.test(processedExpr);
    
    if (hasUnits) {
      const result = mathInstance.evaluate(processedExpr, scope);
      return { result, updatedVariables: {} };
    }
  } catch (error) {
    // Just pass through to regular evaluation
  }
  
  // Handle variable assignment 
  const assignmentMatch = actualExpression.match(/^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$/);
  if (assignmentMatch) {
    const [, variableName, valueExpression] = assignmentMatch;
    
    try {
      // Safe evaluate value
      const value = mathInstance.evaluate(valueExpression, scope);
      
      // Store the value
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
  
  // Check for complex number expressions with i
  let processedExpression = actualExpression;
  
  // Handle expressions like (1+i)^2
  if (actualExpression.includes('i') && !actualExpression.match(/\bi\b\s*[A-Za-z]/)) {
    try {
      const result = mathInstance.evaluate(processedExpression, scope);
      return { result, updatedVariables: {} };
    } catch (error) {
      // Fall through to regular evaluation
      console.error("Complex number error:", error);
    }
  }
  
  // Regular mathematical expression
  try {
    const result = mathInstance.evaluate(processedExpression, scope);
    return { result, updatedVariables: {} };
  } catch (error) {
    return { 
      result: `Error: ${(error as Error).message}`, 
      updatedVariables: {} 
    };
  }
}