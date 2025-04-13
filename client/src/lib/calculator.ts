import * as math from 'mathjs';

// Unit mapping for better recognition
const unitMap: Record<string, string> = {
  'in': 'inch',
  'inch': 'inch',
  'inches': 'inch',
  'ft': 'ft',
  'feet': 'ft',
  'foot': 'ft',
  'yd': 'yd',
  'yard': 'yd',
  'yards': 'yd',
  'm': 'm',
  'meter': 'm',
  'meters': 'm',
  'km': 'km',
  'kilometer': 'km',
  'kilometers': 'km',
  'mile': 'mi',
  'miles': 'mi',
  'mi': 'mi',
  'gal': 'gal',
  'gallon': 'gal',
  'gallons': 'gal',
  'l': 'L',
  'liter': 'L',
  'liters': 'L',
  'L': 'L',
  'kg': 'kg',
  'kilogram': 'kg',
  'kilograms': 'kg',
  'lb': 'lbs',
  'lbs': 'lbs',
  'pound': 'lbs',
  'pounds': 'lbs',
  'c': 'degC',
  'C': 'degC',
  '°C': 'degC',
  'degC': 'degC',
  'celsius': 'degC',
  'f': 'degF',
  'F': 'degF',
  '°F': 'degF',
  'degF': 'degF',
  'fahrenheit': 'degF',
  'rad': 'rad',
  'radian': 'rad',
  'radians': 'rad',
  'deg': 'deg',
  'degree': 'deg',
  'degrees': 'deg'
};

// Create a custom math.js instance with configuration
const mathInstance = math.create(math.all);

// Configure math.js with complex number support
mathInstance.config({
  number: 'number',
  precision: 14
});

// Define the imaginary unit properly
try {
  mathInstance.evaluate('i = complex(0, 1)');
  
  // Add additional implicit multiplication support
  mathInstance.import({
    // This function ensures proper implicit multiplication behavior (like 2x, 5i)
    implicit: function(a: any, b: any): any {
      return math.multiply(a, b);
    }
  }, { override: true });
} catch (e) {
  console.error("Error initializing complex number support", e);
}

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
    
    // Pre-process for special cases
    let processedExpr = actualExpression;
    let updatedVars = {};
    
    // First check for variable assignment
    const assignmentMatch = actualExpression.match(/^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$/);
    if (assignmentMatch) {
      const [, variableName, valueExpression] = assignmentMatch;
      try {
        const { result: value } = evaluateExpression(valueExpression, variables, angleMode);
        if (value !== null && typeof value !== 'string') {
          updatedVars = { [variableName]: value };
          return { result: value, updatedVariables: updatedVars };
        } else {
          return { result: null, updatedVariables: {} };
        }
      } catch (error) {
        return { result: null, updatedVariables: {} };
      }
    }
    
    // For unit conversion expressions
    if (actualExpression.toLowerCase().includes(' to ')) {
      try {
        return handleUnitConversion(actualExpression, variables);
      } catch (error) {
        // Fall through to regular evaluation
      }
    }
    
    // For unit variable attachment
    const variableUnitMatch = actualExpression.match(/^([a-zA-Z][a-zA-Z0-9]*)\s+([a-zA-Z]+)$/);
    if (variableUnitMatch && Object.keys(variables).includes(variableUnitMatch[1])) {
      try {
        return handleVariableUnit(variableUnitMatch, variables);
      } catch (error) {
        // Fall through to regular evaluation
      }
    }
    
    // For unit calculations
    const unitPart = "([a-zA-Z][a-zA-Z0-9]*|\\d+\\.?\\d*)\\s*([a-zA-Z]+)";
    const unitCalculationRegex = new RegExp(`${unitPart}\\s*([+\\-*/])\\s*${unitPart}`);
    const unitCalculationMatch = actualExpression.match(unitCalculationRegex);
    if (unitCalculationMatch) {
      try {
        return handleUnitCalculation(actualExpression, variables);
      } catch (error) {
        // Fall through to regular evaluation
      }
    }
    
    // For regular expressions
    return evaluateExpression(actualExpression, variables, angleMode);
  } catch (error) {
    // Return null for any top-level errors
    return { result: null, updatedVariables: {} };
  }
}

/**
 * Core expression evaluation function
 */
function evaluateExpression(
  expression: string, 
  variables: Record<string, any>, 
  angleMode: 'DEG' | 'RAD'
): { result: any; updatedVariables: Record<string, any> } {
  try {
    // Create math.js scope with variables
    const scope: Record<string, any> = { ...variables };
    
    // Pre-process the expression for complex numbers
    let processedExpr = preProcessComplexNumbers(expression);
    
    // Pre-process the expression for angle mode and trig functions
    processedExpr = preProcessAngles(processedExpr, angleMode, scope);
    
    // Execute the calculation
    let result;
    
    // Special handling for complex numbers to ensure all notations work
    try {
      result = mathInstance.evaluate(processedExpr, scope);
    } catch (e) {
      // If direct evaluation fails, try with forced implicit multiplication
      try {
        // Special case for single 'i' notation (directly complex number)
        if (processedExpr === 'i') {
          result = { re: 0, im: 1 };
        } 
        // Try with additional preprocessing for complex numbers (10i format)
        else if (processedExpr.includes('i')) {
          // Make sure all 'i' are preceded by '*' if they're preceded by a number
          const fixedExpr = processedExpr.replace(/(\d+)(i)/g, '$1*$2');
          result = mathInstance.evaluate(fixedExpr, scope);
        } 
        // Try with additional preprocessing for variable references (10x format)
        else {
          // Find all variable references
          const varNames = Object.keys(scope).filter(key => typeof scope[key] !== 'function');
          
          // Create a regex pattern that matches any variable reference that's not preceded by an operator
          const varPattern = new RegExp(`(\\d+)([${varNames.join('')}])`, 'g');
          
          // Replace "10x" with "10*x" for all variables
          const fixedExpr = processedExpr.replace(varPattern, '$1*$2');
          result = mathInstance.evaluate(fixedExpr, scope);
        }
      } catch (innerError) {
        // If all recovery attempts fail, propagate the original error
        throw e;
      }
    }
    
    return { result, updatedVariables: {} };
  } catch (error) {
    // For any error, return null result
    return { result: null, updatedVariables: {} };
  }
}

/**
 * Handle unit conversion expressions (like "5 km to miles")
 */
function handleUnitConversion(
  expression: string,
  variables: Record<string, any>
): { result: any; updatedVariables: Record<string, any> } {
  try {
    // Replace 'in' with 'inch' to avoid conflicts
    let processedExpr = expression.replace(/\bin\b/g, 'inch');
    
    // Extract value
    const valueMatch = processedExpr.match(/[\d.]+/);
    if (!valueMatch) return { result: null, updatedVariables: {} };
    
    // Try to evaluate with units
    const result = mathInstance.evaluate(processedExpr, variables);
    
    // Format nicely
    if (result && result.value !== undefined) {
      // For unit conversion, use the formatted value and unit
      return { 
        result: `${math.format(result.value, { precision: 5 })} ${result.unit}`, 
        updatedVariables: {} 
      };
    }
    
    return { result, updatedVariables: {} };
  } catch (error) {
    // No result for unit conversion errors
    return { result: null, updatedVariables: {} };
  }
}

/**
 * Handle variable with unit expressions (like "x kg")
 */
function handleVariableUnit(
  match: RegExpMatchArray,
  variables: Record<string, any>
): { result: any; updatedVariables: Record<string, any> } {
  try {
    const [, varName, unitName] = match;
    const varValue = variables[varName];
    
    // Create unit value from the variable
    let unitExpr = '';
    
    // Handle special cases for unit names
    if (unitName.toLowerCase() === 'in') {
      unitExpr = `${varValue} inch`;
    } else {
      unitExpr = `${varValue} ${unitName}`;
    }
    
    const result = mathInstance.evaluate(unitExpr);
    return { result, updatedVariables: {} };
  } catch (error) {
    return { result: null, updatedVariables: {} };
  }
}

/**
 * Handle unit calculation expressions (like "5 m * 10 cm")
 */
function handleUnitCalculation(
  expression: string,
  variables: Record<string, any>
): { result: any; updatedVariables: Record<string, any> } {
  try {
    // Replace 'in' with 'inch' to avoid conflicts
    let processedExpr = expression.replace(/\bin\b/g, 'inch');
    
    // Try to evaluate with units
    const result = mathInstance.evaluate(processedExpr, variables);
    
    return { result, updatedVariables: {} };
  } catch (error) {
    return { result: null, updatedVariables: {} };
  }
}

/**
 * Pre-process expressions for complex number notation
 */
function preProcessComplexNumbers(expression: string): string {
  // First, handle special cases for the entire expression
  let processedExpr = expression.trim();
  
  // Special case 1: Just the letter i by itself
  if (processedExpr === 'i') {
    return 'i'; // Now properly defined at initialization
  }
  
  // Check for variable reference with direct multiplication (like "10x" where x is a variable)
  // This pattern handles cases like "10x" by converting to "10*x"
  processedExpr = processedExpr.replace(/(\d+)([a-zA-Z][a-zA-Z0-9]*)/g, '$1*$2');
  
  // Special case 2: Easy form like 10i (direct coefficient)
  // This has to be done after the variable replacement to avoid conflicts
  if (/^(-?\d+\.?\d*)i$/.test(processedExpr)) {
    const numValue = parseFloat(processedExpr.replace(/i$/, ''));
    return `${numValue}*i`; // For 10i, becomes 10*i
  }
  
  // Special case 3: Form with space like "10 i"
  if (/^(-?\d+\.?\d*)\s+i$/.test(processedExpr)) {
    const match = processedExpr.match(/^(-?\d+\.?\d*)/);
    if (match && match[0]) {
      const numValue = parseFloat(match[0]);
      return `${numValue}*i`; // For "10 i", becomes 10*i
    }
  }
  
  // Replace all numerical coefficients immediately followed by i (like "10i" in expressions)
  processedExpr = processedExpr.replace(/(\b-?\d+\.?\d*)i\b/g, '$1*i');
  
  // Replace all "N i" patterns (number, space, then i) in expressions
  processedExpr = processedExpr.replace(/(\b-?\d+\.?\d*)\s+i\b/g, '$1*i');
  
  return processedExpr;
}

/**
 * Pre-process expressions for angle mode and trig functions
 */
function preProcessAngles(
  expression: string, 
  angleMode: 'DEG' | 'RAD',
  scope: Record<string, any>
): string {
  let processedExpr = expression;
  
  // Add degree/radian conversion helpers to scope
  scope.deg2rad = (deg: number) => deg * DEG_TO_RAD;
  scope.rad2deg = (rad: number) => rad * RAD_TO_DEG;
  scope.PI = PI;
  
  // Ensure complex number support is properly available
  try {
    // Define the complex function and imaginary unit
    scope.complex = mathInstance.evaluate('complex');
    
    // Explicitly define i in the scope to ensure it's available
    scope.i = { re: 0, im: 1 };
  } catch (error) {
    console.error("Error setting up complex number support:", error);
  }
  
  // Add custom trig functions that handle the right angle mode
  if (angleMode === 'DEG') {
    // DEG mode - functions take degrees and return degrees
    scope.sin = (x: number) => Math.sin(x * DEG_TO_RAD);
    scope.cos = (x: number) => Math.cos(x * DEG_TO_RAD);
    scope.tan = (x: number) => Math.tan(x * DEG_TO_RAD);
    scope.asin = (x: number) => Math.asin(x) * RAD_TO_DEG;
    scope.acos = (x: number) => Math.acos(x) * RAD_TO_DEG;
    scope.atan = (x: number) => Math.atan(x) * RAD_TO_DEG;
  } else {
    // RAD mode - functions use radians directly
    scope.sin = Math.sin;
    scope.cos = Math.cos;
    scope.tan = Math.tan;
    scope.asin = Math.asin;
    scope.acos = Math.acos;
    scope.atan = Math.atan;
  }
  
  // Add aliases for inverse trig functions
  scope.arcsin = scope.asin;
  scope.arccos = scope.acos;
  scope.arctan = scope.atan;
  
  // Handle deg/rad notation in expressions
  processedExpr = processedExpr.replace(/(\d+\.?\d*)\s*deg/g, (_, num) => {
    return angleMode === 'DEG' ? num : `(${num} * PI / 180)`;
  });
  
  processedExpr = processedExpr.replace(/(\d+\.?\d*)\s*rad/g, (_, num) => {
    return angleMode === 'RAD' ? num : `(${num} * 180 / PI)`;
  });
  
  return processedExpr;
}