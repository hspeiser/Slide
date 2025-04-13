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
 * Pre-process expressions for complex number notation
 */
function preProcessComplexNumbers(expression: string): string {
  // Quick pass-through if no 'i' in the expression
  if (!expression.includes('i')) {
    return expression;
  }
  
  let processedExpr = expression.trim();
  
  // Special case: Just i by itself
  if (processedExpr === 'i') {
    return 'i';
  }
  
  // Special case for variable references with "i" in them (like "sin")
  // We need to avoid transforming those, so we handle simple cases directly
  
  // For "10i" pattern - transform to "10*i"
  processedExpr = processedExpr.replace(/(\d+\.?\d*)i\b/g, '$1*i');
  
  // For "10 i" pattern with a space - transform to "10*i"
  processedExpr = processedExpr.replace(/(\d+\.?\d*)\s+i\b/g, '$1*i');
  
  // Handle patterns inside larger expressions
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
  scope.complex = mathInstance.evaluate('complex');
  scope.i = mathInstance.evaluate('complex(0,1)');
  
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