import * as math from 'mathjs';

// Extend the ConfigOptions type to include the implicit option
declare module 'mathjs' {
  interface ConfigOptions {
    implicit?: 'hide' | 'show';
  }
}

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

// Configure math.js with complex number support and implicit multiplication
mathInstance.config({
  number: 'number',
  precision: 14,
  implicit: 'show'  // Enable implicit multiplication
});

// Define a custom operator for parallel resistors using the || symbol
// Formula: R_parallel = 1 / (1/R1 + 1/R2)
mathInstance.import({
  '||': function(a: any, b: any): any {
    // Handle complex numbers and any other type mathjs can divide
    try {
      // Convert to numbers if strings
      if (typeof a === 'string') a = mathInstance.evaluate(a);
      if (typeof b === 'string') b = mathInstance.evaluate(b);
      
      // Both values must be non-zero to avoid division by zero
      if (mathInstance.equal(a, 0) || mathInstance.equal(b, 0)) {
        throw new Error('Cannot calculate parallel value with zero resistance');
      }
      
      // Calculate 1/(1/a + 1/b)
      const oneOverA = mathInstance.divide(1, a);
      const oneOverB = mathInstance.divide(1, b);
      const sum = mathInstance.add(oneOverA, oneOverB);
      return mathInstance.divide(1, sum);
    } catch (error: any) {
      throw new Error('Error calculating parallel values: ' + (error.message || 'Unknown error'));
    }
  }
}, { override: true });

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
    
    // Create proper scope with trig functions for the right angle mode
    const scope: Record<string, any> = { ...variables };
    
    // Add important constants and complex number support
    scope.PI = PI;
    scope.pi = PI;
    scope.e = Math.E;
    scope.i = mathInstance.evaluate('complex(0, 1)');
    
    // Add common math functions
    scope.abs = Math.abs;
    scope.sqrt = Math.sqrt;
    scope.cbrt = Math.cbrt;
    scope.exp = Math.exp;
    scope.log = Math.log;
    scope.ln = Math.log;  // Add natural log (ln) as an alias for log
    scope.log10 = Math.log10;
    scope.log2 = Math.log2;
    scope.pow = Math.pow;
    scope.round = Math.round;
    scope.floor = Math.floor;
    scope.ceil = Math.ceil;
    scope.max = Math.max;
    scope.min = Math.min;
    
    // Hyperbolic functions
    scope.sinh = Math.sinh;
    scope.cosh = Math.cosh;
    scope.tanh = Math.tanh;
    scope.asinh = Math.asinh;
    scope.acosh = Math.acosh;
    scope.atanh = Math.atanh;
    
    // Configure trig functions based on angle mode
    if (angleMode === 'DEG') {
      // DEG mode - functions take degrees as input
      scope.sin = (x: number) => Math.sin(x * DEG_TO_RAD);
      scope.cos = (x: number) => Math.cos(x * DEG_TO_RAD);
      scope.tan = (x: number) => Math.tan(x * DEG_TO_RAD);
      scope.asin = (x: number) => Math.asin(x) * RAD_TO_DEG;
      scope.acos = (x: number) => Math.acos(x) * RAD_TO_DEG;
      scope.atan = (x: number) => Math.atan(x) * RAD_TO_DEG;
      scope.atan2 = (y: number, x: number) => Math.atan2(y, x) * RAD_TO_DEG;
      
      // Add aliases for inverse trig functions
      scope.arcsin = scope.asin;
      scope.arccos = scope.acos;
      scope.arctan = scope.atan;
    } else {
      // RAD mode - functions use radians directly
      scope.sin = Math.sin;
      scope.cos = Math.cos;
      scope.tan = Math.tan;
      scope.asin = Math.asin;
      scope.acos = Math.acos;
      scope.atan = Math.atan;
      scope.atan2 = Math.atan2;
      
      // Add aliases for inverse trig functions
      scope.arcsin = Math.asin;
      scope.arccos = Math.acos;
      scope.arctan = Math.atan;
    }
    
    // 2. Variable assignment?
    const assign = expr.match(/^\s*([a-zA-Z_]\w*)\s*=\s*(.+)$/);
    if (assign) {
      const [, name, rhs] = assign;
      const value = mathInstance.evaluate(rhs, scope);
      return { result: value, updatedVariables: { [name]: value } };
    }
    
    // 3. Unit conversion (only works if there's a space after the number)
    if (expr.toLowerCase().includes(' to ')) {
      try {
        const result = mathInstance.evaluate(expr, scope);
        
        // For unit conversion, we want to return the full object
        // so the formatter in Calculator.tsx can apply proper decimal places
        return { result, updatedVariables: {} };
      } catch (error) {
        // Fall through to regular evaluation
      }
    }
    
    // 4. Plain evaluation – implicit multiplication now "just works"
    const result = mathInstance.evaluate(expr, scope);
    return { result, updatedVariables: {} };
  } catch (error) {
    // Return null for any top-level errors
    return { result: null, updatedVariables: {} };
  }
}

/**
 * Handle spaces in expressions - convert any non-breaking spaces to regular spaces
 * With implicit multiplication enabled, we no longer need to manually convert spaces
 * to multiplication operators - mathjs handles this automatically
 */
function handleSpaces(expression: string): string {
  // Convert any non-breaking spaces to regular spaces and normalize spacing
  return expression.replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim();
}