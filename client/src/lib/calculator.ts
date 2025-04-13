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
    
    // Create proper scope with trig functions for the right angle mode
    const scope: Record<string, any> = { ...variables };
    
    // Add important constants and complex number support
    scope.PI = PI;
    scope.i = mathInstance.evaluate('complex(0, 1)');
    
    // Configure trig functions based on angle mode
    if (angleMode === 'DEG') {
      // DEG mode - functions take degrees as input
      scope.sin = (x: number) => Math.sin(x * DEG_TO_RAD);
      scope.cos = (x: number) => Math.cos(x * DEG_TO_RAD);
      scope.tan = (x: number) => Math.tan(x * DEG_TO_RAD);
      scope.asin = (x: number) => Math.asin(x) * RAD_TO_DEG;
      scope.acos = (x: number) => Math.acos(x) * RAD_TO_DEG;
      scope.atan = (x: number) => Math.atan(x) * RAD_TO_DEG;
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
        return { result: result.toString(), updatedVariables: {} };
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