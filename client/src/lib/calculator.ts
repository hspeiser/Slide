import * as math from 'mathjs';

// Unit conversion mappings
const unitConversions: Record<string, { fromUnit: string; toUnit: string }> = {
  'km to miles': { fromUnit: 'km', toUnit: 'mi' },
  'miles to km': { fromUnit: 'mi', toUnit: 'km' },
  'kg to lbs': { fromUnit: 'kg', toUnit: 'lbs' },
  'lbs to kg': { fromUnit: 'lbs', toUnit: 'kg' },
  'm to ft': { fromUnit: 'm', toUnit: 'ft' },
  'ft to m': { fromUnit: 'ft', toUnit: 'm' },
  'l to gal': { fromUnit: 'L', toUnit: 'gal' },
  'gal to l': { fromUnit: 'gal', toUnit: 'L' },
  '°C to °F': { fromUnit: 'degC', toUnit: 'degF' },
  '°F to °C': { fromUnit: 'degF', toUnit: 'degC' },
};

// Create a custom math.js instance with configuration
const mathInstance = math.create(math.all);

// Configure math.js
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

  // Handle unit conversions
  const unitConversionMatch = Object.keys(unitConversions).find(key => 
    actualExpression.toLowerCase().includes(key)
  );
  
  if (unitConversionMatch) {
    const { fromUnit, toUnit } = unitConversions[unitConversionMatch];
    const valueMatch = actualExpression.match(/[\d.]+/);
    
    if (valueMatch) {
      const value = parseFloat(valueMatch[0]);
      try {
        const converted = mathInstance.evaluate(`${value} ${fromUnit} to ${toUnit}`);
        return { 
          result: `${math.format(converted.value, { precision: 5 })} ${toUnit}`, 
          updatedVariables: {} 
        };
      } catch (error) {
        return { result: `Error: Invalid conversion`, updatedVariables: {} };
      }
    }
  }

  // Create a scope with current variables
  const scope = { ...variables };
  
  // Configure angle mode
  scope.angleMode = angleMode === 'DEG' ? 'deg' : 'rad';
  
  // Handle variable assignment
  const assignmentMatch = actualExpression.match(/^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$/);
  
  if (assignmentMatch) {
    const [, variableName, valueExpression] = assignmentMatch;
    
    try {
      // Use angle mode appropriate for trig functions
      const value = mathInstance.evaluate(valueExpression, scope);
      
      // Update variables and return the result
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
    // Handle angle mode for trigonometric functions
    let processedExpression = actualExpression;
    
    if (angleMode === 'DEG') {
      // For degrees mode, we'll need to manually convert angles
      // Look for trig functions and modify the expression
      const trigFunctions = ['sin', 'cos', 'tan', 'sec', 'csc', 'cot'];
      
      for (const func of trigFunctions) {
        // Check if the expression contains this trig function
        if (processedExpression.includes(func + '(')) {
          // Replace trig function calls with converted version
          processedExpression = processedExpression.replace(
            new RegExp(`${func}\\(([^)]+)\\)`, 'g'),
            `${func}(${func === 'sin' || func === 'tan' || func === 'csc' || func === 'cot' ? '$1 * pi / 180' : '$1 * pi / 180'})`
          );
        }
      }
    }
      
    // Configure general math settings
    mathInstance.config({
      number: 'number',
      precision: 14
    });
    
    const result = mathInstance.evaluate(processedExpression, scope);
    return { result, updatedVariables: {} };
  } catch (error) {
    return { 
      result: `Error: ${(error as Error).message}`, 
      updatedVariables: {} 
    };
  }
}
