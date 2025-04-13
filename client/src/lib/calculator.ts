import * as math from 'mathjs';

// Unit conversion mappings
const unitConversions: Record<string, { fromUnit: string; toUnit: string }> = {
  'km to miles': { fromUnit: 'km', toUnit: 'mi' },
  'miles to km': { fromUnit: 'mi', toUnit: 'km' },
  'kg to lbs': { fromUnit: 'kg', toUnit: 'lbs' },
  'lbs to kg': { fromUnit: 'lbs', toUnit: 'kg' },
  'm to ft': { fromUnit: 'm', toUnit: 'ft' },
  'ft to m': { fromUnit: 'ft', toUnit: 'm' },
  'm to in': { fromUnit: 'm', toUnit: 'inch' },
  'in to m': { fromUnit: 'inch', toUnit: 'm' },
  'yd to in': { fromUnit: 'yd', toUnit: 'inch' },
  'yard to in': { fromUnit: 'yd', toUnit: 'inch' },
  'in to yd': { fromUnit: 'inch', toUnit: 'yd' },
  'in to yard': { fromUnit: 'inch', toUnit: 'yd' },
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
  
  // Create a scope with current variables immediately
  const scope = { ...variables };
  
  // Configure angle mode 
  scope.angleMode = angleMode === 'DEG' ? 'deg' : 'rad';

  // Check if this is adding units to a variable (e.g., "x in" or "x m")
  const variableUnitMatch = actualExpression.match(/^([a-zA-Z][a-zA-Z0-9]*)\s+([a-zA-Z]+)$/);
  if (variableUnitMatch && Object.keys(variables).includes(variableUnitMatch[1])) {
    const [, varName, unitName] = variableUnitMatch;
    const varValue = variables[varName];
    
    try {
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
      // Pass through to normal evaluation if this fails
    }
  }

  // Check for unit calculations (e.g., "0.255 in * 10 in" or "x m * 10")
  const unitPart = "([a-zA-Z][a-zA-Z0-9]*|\\d+\\.?\\d*)\\s*([a-zA-Z]+)";
  const unitCalculationRegex = new RegExp(`${unitPart}\\s*([+\\-*/])\\s*${unitPart}`);
  const unitCalculationMatch = actualExpression.match(unitCalculationRegex);
  
  if (unitCalculationMatch) {
    try {
      // Replace 'in' with 'inch' to avoid keyword conflicts
      let processedExpr = actualExpression.replace(/\bin\b/g, 'inch');
      
      // Try to evaluate with units
      const result = mathInstance.evaluate(processedExpr, scope);
      return { result, updatedVariables: {} };
    } catch (error) {
      // Just pass through to regular evaluation if this fails
    }
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
        // For "m to in", use explicit inch handling
        if (fromUnit === 'm' && toUnit === 'inch') {
          const converted = mathInstance.evaluate(`${value} m to inch`);
          return { 
            result: `${math.format(converted.value, { precision: 5 })} inch`, 
            updatedVariables: {} 
          };
        }
        
        const converted = mathInstance.evaluate(`${value} ${fromUnit} to ${toUnit}`);
        return { 
          result: `${math.format(converted.value, { precision: 5 })} ${toUnit}`, 
          updatedVariables: {} 
        };
      } catch (error) {
        // Fall through to regular evaluation
      }
    }
  }
  
  // Handle variable assignment
  const assignmentMatch = actualExpression.match(/^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$/);
  
  if (assignmentMatch) {
    const [, variableName, valueExpression] = assignmentMatch;
    
    // Pre-process the expression for angle conversions
    let processedValueExpr = valueExpression;
    
    // Define a custom function to handle degrees in our scope
    if (angleMode === 'DEG') {
      // Regular trig functions
      processedValueExpr = processedValueExpr
        .replace(/\bsin\s*\(/g, 'sin(deg2rad(')
        .replace(/\bcos\s*\(/g, 'cos(deg2rad(')
        .replace(/\btan\s*\(/g, 'tan(deg2rad(')
        .replace(/\)/g, '))');
        
      // Add degree conversion functions to scope
      scope.deg2rad = (degrees: number) => degrees * Math.PI / 180;
      scope.rad2deg = (radians: number) => radians * 180 / Math.PI;
      
      // Inverse trig functions
      // Replace arcsin/arccos/arctan with asin/acos/atan
      processedValueExpr = processedValueExpr
        .replace(/\barcsin\s*\(/g, 'rad2deg(asin(')
        .replace(/\barccos\s*\(/g, 'rad2deg(acos(')  
        .replace(/\barctan\s*\(/g, 'rad2deg(atan(');
        
      // Then handle asin/acos/atan  
      processedValueExpr = processedValueExpr
        .replace(/\basin\s*\(/g, 'rad2deg(asin(')
        .replace(/\bacos\s*\(/g, 'rad2deg(acos(')
        .replace(/\batan\s*\(/g, 'rad2deg(atan(');
    }
    
    try {
      // Use angle mode appropriate for trig functions
      const value = mathInstance.evaluate(processedValueExpr, scope);
      
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
    // Process expression based on angle mode
    let processedExpression = actualExpression;
    
    // Define a custom function to handle degrees in our scope
    if (angleMode === 'DEG') {
      // Add degree conversion functions to scope
      scope.deg2rad = (degrees: number) => degrees * Math.PI / 180;
      scope.rad2deg = (radians: number) => radians * 180 / Math.PI;
      
      // Regular trig functions
      processedExpression = processedExpression
        .replace(/\bsin\s*\(/g, 'sin(deg2rad(')
        .replace(/\bcos\s*\(/g, 'cos(deg2rad(')
        .replace(/\btan\s*\(/g, 'tan(deg2rad(')
        .replace(/\)/g, '))');
      
      // Inverse trig functions  
      // Replace arcsin/arccos/arctan with asin/acos/atan
      processedExpression = processedExpression
        .replace(/\barcsin\s*\(/g, 'rad2deg(asin(')
        .replace(/\barccos\s*\(/g, 'rad2deg(acos(')  
        .replace(/\barctan\s*\(/g, 'rad2deg(atan(');
        
      // Then handle asin/acos/atan  
      processedExpression = processedExpression
        .replace(/\basin\s*\(/g, 'rad2deg(asin(')
        .replace(/\bacos\s*\(/g, 'rad2deg(acos(')
        .replace(/\batan\s*\(/g, 'rad2deg(atan(');
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