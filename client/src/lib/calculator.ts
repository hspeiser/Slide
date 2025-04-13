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

// Create a completely fresh math.js instance with better configuration
const mathInstance = math.create(math.all);

// Configure math.js with explicit options for optimal calculator behavior
mathInstance.config({
  number: 'number',    // Use JavaScript's number type
  precision: 14,       // Higher precision for calculations
  epsilon: 1e-12       // Smaller epsilon for more accurate floating point comparisons
});

// Enable parser system with implicit multiplication handling
mathInstance.import({
  // Add our own custom implicit multiplication handler 
  // that properly handles expressions like 5x or 2i
  'multiply': function(a: any, b: any): any {
    // Handle the special case of 5i where i is the imaginary unit
    if (typeof a === 'number' && b && typeof b === 'object' && 
        're' in b && 'im' in b && b.re === 0 && b.im === 1) {
      return { re: 0, im: a }; // Return a properly formatted complex number
    }
    
    // For all other cases, use the regular math.js multiply function
    return math.multiply(a, b);
  }
}, { override: true });

// Create a persistent parser to handle complex expressions
const parser = mathInstance.parser();

// Define the imaginary unit i on both the parser and core instance
parser.evaluate('i = complex(0, 1)');
mathInstance.evaluate('i = complex(0, 1)');

// Create special handlers for common mathematical notations
mathInstance.import({
  // Handler for direct imaginary values like 5i
  'processImaginary': function(num: number): any {
    return { re: 0, im: num };
  }
}, { override: true });

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
    // Create a parser with context so variables persist
    const localParser = mathInstance.parser();
    
    // First set up the scope with all variables
    for (const [key, value] of Object.entries(variables)) {
      localParser.set(key, value);
    }
    
    // Make sure i is always properly defined
    localParser.set('i', { re: 0, im: 1 });
    
    // Pre-process for angle mode and other special functions
    const scope: Record<string, any> = {};
    
    // Add these to both scope and parser
    scope.PI = PI;
    localParser.set('PI', PI);
    
    scope.deg2rad = (deg: number) => deg * DEG_TO_RAD;
    localParser.set('deg2rad', scope.deg2rad);
    
    scope.rad2deg = (rad: number) => rad * RAD_TO_DEG;
    localParser.set('rad2deg', scope.rad2deg);
    
    // Add custom trig functions for correct angle mode
    if (angleMode === 'DEG') {
      // DEG mode - functions take degrees and return degrees
      const sinDeg = (x: number) => Math.sin(x * DEG_TO_RAD);
      const cosDeg = (x: number) => Math.cos(x * DEG_TO_RAD);
      const tanDeg = (x: number) => Math.tan(x * DEG_TO_RAD);
      const asinDeg = (x: number) => Math.asin(x) * RAD_TO_DEG;
      const acosDeg = (x: number) => Math.acos(x) * RAD_TO_DEG;
      const atanDeg = (x: number) => Math.atan(x) * RAD_TO_DEG;
      
      localParser.set('sin', sinDeg);
      localParser.set('cos', cosDeg);
      localParser.set('tan', tanDeg);
      localParser.set('asin', asinDeg);
      localParser.set('acos', acosDeg);
      localParser.set('atan', atanDeg);
      localParser.set('arcsin', asinDeg);
      localParser.set('arccos', acosDeg);
      localParser.set('arctan', atanDeg);
    }
    
    // Pre-process the expression with our complex number and implicit multiplication handlers
    let processedExpr = expression.trim();
    
    // Special case for just 'i'
    if (processedExpr === 'i') {
      return { result: { re: 0, im: 1 }, updatedVariables: {} };
    }
    
    // Handle direct imaginary numbers like 10i
    processedExpr = processedExpr.replace(/(\d+)i\b/g, '$1*i');
    
    // Handle direct variable multiplication like 10x where x is a variable
    Object.keys(variables).forEach(varName => {
      if (varName === 'i') return; // Skip i as it's handled separately
      
      // Create pattern that matches a number followed by this variable name
      const pattern = new RegExp(`(\\d+)${varName}\\b`, 'g');
      processedExpr = processedExpr.replace(pattern, `$1*${varName}`);
    });
    
    // Handle deg/rad notation in expressions
    processedExpr = processedExpr.replace(/(\d+\.?\d*)\s*deg/g, (_, num) => {
      return angleMode === 'DEG' ? num : `(${num} * PI / 180)`;
    });
    
    processedExpr = processedExpr.replace(/(\d+\.?\d*)\s*rad/g, (_, num) => {
      return angleMode === 'RAD' ? num : `(${num} * 180 / PI)`;
    });
    
    try {
      // Use the parser to evaluate
      const result = localParser.evaluate(processedExpr);
      return { result, updatedVariables: {} };
    } catch (firstError) {
      // If it fails, try more aggressive replacements
      try {
        // Add all possible * for adjacency
        const withAllImplicit = processedExpr.replace(/(\d+)([a-zA-Z])/g, '$1*$2');
        const result = localParser.evaluate(withAllImplicit);
        return { result, updatedVariables: {} };
      } catch (e) {
        // For specific case of 10i
        if (/^\s*\d+i\s*$/.test(processedExpr)) {
          const num = parseFloat(processedExpr.replace(/i/g, ''));
          return { 
            result: { re: 0, im: num },
            updatedVariables: {} 
          };
        }
        
        // If all attempts fail
        throw firstError;
      }
    }
  } catch (error) {
    // For any error, return null result
    console.error("Evaluation error:", error);
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