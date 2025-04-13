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
    const result = mathInstance.evaluate(processedExpr, scope);
    
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
 * Pre-process expressions for complex number notation and implicit multiplication
 */
function preProcessComplexNumbers(expression: string): string {
  // First, handle special cases for the entire expression
  let processedExpr = expression.trim();
  
  // Special case 1: Just the letter i by itself
  if (processedExpr === 'i') {
    return 'complex(0,1)'; // Set it directly to complex(0,1) for clarity
  }
  
  // Special case 2: Easy form like 10i (direct coefficient)
  const directCoefficient = /^(-?\d+\.?\d*)i$/.exec(processedExpr);
  if (directCoefficient) {
    const [, num] = directCoefficient;
    return `${num}*i`; // For 10i, becomes 10*i
  }
  
  // Special case 3: Form with space like "10 i"
  const spaceCoefficient = /^(-?\d+\.?\d*)\s+i$/.exec(processedExpr);
  if (spaceCoefficient) {
    const [, num] = spaceCoefficient;
    return `${num}*i`; // For "10 i", becomes 10*i
  }
  
  // Special case 4: Explicit multiplication like "10*i" or "10 * i"
  const multiplyCoefficient = /^(-?\d+\.?\d*)\s*\*\s*i$/.exec(processedExpr);
  if (multiplyCoefficient) {
    return processedExpr; // Already in correct form
  }
  
  // === CRUCIAL PREPROCESSING REPLACEMENTS ===
  
  // 1. FIRST PASS: Convert non-breaking spaces to regular spaces for processing
  processedExpr = processedExpr.replace(/\u00A0/g, ' ');
  
  // 2. SECOND PASS: Replace direct number-variable cases (10x → 10*x)
  // This is the main issue we need to fix! Using word boundaries to be precise
  processedExpr = processedExpr.replace(/(\d+)([a-zA-Z])/g, '$1*$2');
  
  // 3. Handle decimal numbers followed by variables (10.5x → 10.5*x)
  processedExpr = processedExpr.replace(/(\d+\.\d+)([a-zA-Z])/g, '$1*$2');
  
  // 4. Handle imaginary unit with coefficient (10i → 10*i)
  processedExpr = processedExpr.replace(/(\b\d+\.?\d*)i\b/g, '$1*i');
  
  // 5. Handle negative numbers with i (-10i → -10*i)
  processedExpr = processedExpr.replace(/(-\d+\.?\d*)i\b/g, '$1*i');
  
  // 6. Handle spaces before i (10 i → 10*i)
  processedExpr = processedExpr.replace(/(\b\d+\.?\d*)\s+i\b/g, '$1*i');
  
  // 7. Handle implicit multiplication between variables (xy → x*y) 
  // but we need to be careful not to break function names
  const knownFunctions = ['sin', 'cos', 'tan', 'log', 'exp', 'sqrt', 'asin', 'acos', 'atan'];
  
  // Create a function to check if a string is a known function
  const isKnownFunction = (str: string) => knownFunctions.includes(str);
  
  // Now handle variable multiplication safely
  processedExpr = processedExpr.replace(/([a-zA-Z][a-zA-Z0-9_]*)([a-zA-Z][a-zA-Z0-9_]*)/g, 
    (match, p1, p2) => {
      // Skip if the entire match is a known function name
      if (isKnownFunction(match)) {
        return match;
      }
      
      // Skip if p1 is a known function and p2 is a single character
      // (this would be the case for something like "sin x")
      if (isKnownFunction(p1) && p2.length === 1) {
        return match;
      }
      
      return `${p1}*${p2}`;
    }
  );
  
  // Handle implicit multiplication with parentheses: 2(x+1) -> 2*(x+1)
  processedExpr = processedExpr.replace(/(\d+\.?\d*)\s*\(/g, '$1*(');
  
  // Handle implicit multiplication between variable and parentheses: x(y+1) -> x*(y+1)
  processedExpr = processedExpr.replace(/([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g, '$1*(');
  
  // Handle implicit multiplication between closing and opening parentheses: (x+1)(y+2) -> (x+1)*(y+2)
  processedExpr = processedExpr.replace(/\)\s*\(/g, ')*(');
  
  // Special case for imaginary unit: 10(i) -> 10*i, not 10*(i)
  processedExpr = processedExpr.replace(/\*\(i\)/g, '*i');
  
  // Fix for 100*i causing a numeric precision problem
  // Look for and fix cases like 100*i transforming to just 1i in output
  if (processedExpr.match(/\d+\s*\*\s*i\b/)) {
    // Add a comment to preserve the original expression for later display
    processedExpr = processedExpr + " // originalExpr:" + processedExpr;
  }
  
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
  // First, normalize spaces (reduce multiple spaces to single spaces)
  // then handle spaces as implicit multiplication indicators where appropriate
  let processedExpr = handleSpaces(expression);
  
  // Add degree/radian conversion helpers to scope
  scope.deg2rad = (deg: number) => deg * DEG_TO_RAD;
  scope.rad2deg = (rad: number) => rad * RAD_TO_DEG;
  scope.PI = PI;
  scope.complex = mathInstance.evaluate('complex');
  scope.i = mathInstance.evaluate('complex(0,1)');
  scope.j = mathInstance.evaluate('complex(0,1)'); // Also support j for imaginary unit
  
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

/**
 * Handle spaces in expressions, treating them as potential multiplication operators
 * This enables expressions like "2 x" to be interpreted as "2*x"
 */
function handleSpaces(expression: string): string {
  // Convert any non-breaking spaces to regular spaces first
  let processedExpr = expression.replace(/\u00A0/g, ' ');
  
  // Then normalize any multiple spaces to single spaces
  processedExpr = processedExpr.replace(/\s+/g, ' ').trim();
  
  // Handle spaces between numbers and variables: "2 x" -> "2*x"
  processedExpr = processedExpr.replace(/(\b\d+\.?\d*)\s+([a-zA-Z_][a-zA-Z0-9_]*\b)/g, '$1*$2');
  
  // Handle spaces between variables: "x y" -> "x*y"
  processedExpr = processedExpr.replace(/([a-zA-Z_][a-zA-Z0-9_]*)\s+([a-zA-Z_][a-zA-Z0-9_]*)/g, '$1*$2');
  
  // Handle spaces between number and opening parenthesis: "2 (x+1)" -> "2*(x+1)"
  processedExpr = processedExpr.replace(/(\b\d+\.?\d*)\s+\(/g, '$1*(');
  
  // Handle spaces between variables and opening parenthesis: "x (y+1)" -> "x*(y+1)"
  processedExpr = processedExpr.replace(/([a-zA-Z_][a-zA-Z0-9_]*)\s+\(/g, '$1*(');
  
  // Handle spaces between closing and opening parentheses: ") (" -> ")*("
  processedExpr = processedExpr.replace(/\)\s+\(/g, ')*(');
  
  // Handle spaces between closing parenthesis and variable: ") x" -> ")*x"
  processedExpr = processedExpr.replace(/\)\s+([a-zA-Z_][a-zA-Z0-9_]*)/g, ')*$1');
  
  // Handle spaces between closing parenthesis and number: ") 2" -> ")*2"
  processedExpr = processedExpr.replace(/\)\s+(\d+\.?\d*)/g, ')*$1');
  
  // Remove any remaining spaces in the expression (except in function names and around operators)
  // First protect spaces around operators
  processedExpr = processedExpr.replace(/\s*([+\-*/^=])\s*/g, ' $1 ');
  
  // Now remove spaces not around operators
  processedExpr = processedExpr.replace(/([^+\-*/^=\s])\s+([^+\-*/^=\s])/g, '$1$2');
  
  return processedExpr;
}