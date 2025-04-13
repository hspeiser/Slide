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

// Unit conversion mappings
const unitConversions: Record<string, { fromUnit: string; toUnit: string }> = {
  'km to miles': { fromUnit: 'km', toUnit: 'mi' },
  'kilometer to miles': { fromUnit: 'km', toUnit: 'mi' },
  'kilometers to miles': { fromUnit: 'km', toUnit: 'mi' },
  'km to mi': { fromUnit: 'km', toUnit: 'mi' },
  'miles to km': { fromUnit: 'mi', toUnit: 'km' },
  'mi to km': { fromUnit: 'mi', toUnit: 'km' },
  'miles to kilometer': { fromUnit: 'mi', toUnit: 'km' },
  'miles to kilometers': { fromUnit: 'mi', toUnit: 'km' },
  
  'kg to lbs': { fromUnit: 'kg', toUnit: 'lbs' },
  'kg to lb': { fromUnit: 'kg', toUnit: 'lbs' },
  'kg to pounds': { fromUnit: 'kg', toUnit: 'lbs' },
  'kilogram to pounds': { fromUnit: 'kg', toUnit: 'lbs' },
  'kilograms to pounds': { fromUnit: 'kg', toUnit: 'lbs' },
  
  'lbs to kg': { fromUnit: 'lbs', toUnit: 'kg' },
  'lb to kg': { fromUnit: 'lbs', toUnit: 'kg' },
  'pounds to kg': { fromUnit: 'lbs', toUnit: 'kg' },
  'pounds to kilogram': { fromUnit: 'lbs', toUnit: 'kg' },
  'pounds to kilograms': { fromUnit: 'lbs', toUnit: 'kg' },
  
  'm to ft': { fromUnit: 'm', toUnit: 'ft' },
  'meter to ft': { fromUnit: 'm', toUnit: 'ft' },
  'meters to ft': { fromUnit: 'm', toUnit: 'ft' },
  'm to feet': { fromUnit: 'm', toUnit: 'ft' },
  'meter to feet': { fromUnit: 'm', toUnit: 'ft' },
  'meters to feet': { fromUnit: 'm', toUnit: 'ft' },
  
  'ft to m': { fromUnit: 'ft', toUnit: 'm' },
  'feet to m': { fromUnit: 'ft', toUnit: 'm' },
  'foot to m': { fromUnit: 'ft', toUnit: 'm' },
  'ft to meter': { fromUnit: 'ft', toUnit: 'm' },
  'feet to meter': { fromUnit: 'ft', toUnit: 'm' },
  'ft to meters': { fromUnit: 'ft', toUnit: 'm' },
  'feet to meters': { fromUnit: 'ft', toUnit: 'm' },
  
  'm to in': { fromUnit: 'm', toUnit: 'inch' },
  'meter to in': { fromUnit: 'm', toUnit: 'inch' },
  'meters to in': { fromUnit: 'm', toUnit: 'inch' },
  'm to inch': { fromUnit: 'm', toUnit: 'inch' },
  'meter to inch': { fromUnit: 'm', toUnit: 'inch' },
  'meters to inch': { fromUnit: 'm', toUnit: 'inch' },
  'm to inches': { fromUnit: 'm', toUnit: 'inch' },
  'meter to inches': { fromUnit: 'm', toUnit: 'inch' },
  'meters to inches': { fromUnit: 'm', toUnit: 'inch' },
  
  'in to m': { fromUnit: 'inch', toUnit: 'm' },
  'inch to m': { fromUnit: 'inch', toUnit: 'm' },
  'inches to m': { fromUnit: 'inch', toUnit: 'm' },
  'in to meter': { fromUnit: 'inch', toUnit: 'm' },
  'inch to meter': { fromUnit: 'inch', toUnit: 'm' },
  'inches to meter': { fromUnit: 'inch', toUnit: 'm' },
  'in to meters': { fromUnit: 'inch', toUnit: 'm' },
  'inch to meters': { fromUnit: 'inch', toUnit: 'm' },
  'inches to meters': { fromUnit: 'inch', toUnit: 'm' },
  
  'yd to in': { fromUnit: 'yd', toUnit: 'inch' },
  'yard to in': { fromUnit: 'yd', toUnit: 'inch' },
  'yards to in': { fromUnit: 'yd', toUnit: 'inch' },
  'yd to inch': { fromUnit: 'yd', toUnit: 'inch' },
  'yard to inch': { fromUnit: 'yd', toUnit: 'inch' },
  'yards to inch': { fromUnit: 'yd', toUnit: 'inch' },
  'yd to inches': { fromUnit: 'yd', toUnit: 'inch' },
  'yard to inches': { fromUnit: 'yd', toUnit: 'inch' },
  'yards to inches': { fromUnit: 'yd', toUnit: 'inch' },
  
  'in to yd': { fromUnit: 'inch', toUnit: 'yd' },
  'inch to yd': { fromUnit: 'inch', toUnit: 'yd' },
  'inches to yd': { fromUnit: 'inch', toUnit: 'yd' },
  'in to yard': { fromUnit: 'inch', toUnit: 'yd' },
  'inch to yard': { fromUnit: 'inch', toUnit: 'yd' },
  'inches to yard': { fromUnit: 'inch', toUnit: 'yd' },
  'in to yards': { fromUnit: 'inch', toUnit: 'yd' },
  'inch to yards': { fromUnit: 'inch', toUnit: 'yd' },
  'inches to yards': { fromUnit: 'inch', toUnit: 'yd' },
  
  'l to gal': { fromUnit: 'L', toUnit: 'gal' },
  'L to gal': { fromUnit: 'L', toUnit: 'gal' },
  'liter to gal': { fromUnit: 'L', toUnit: 'gal' },
  'liters to gal': { fromUnit: 'L', toUnit: 'gal' },
  'l to gallon': { fromUnit: 'L', toUnit: 'gal' },
  'L to gallon': { fromUnit: 'L', toUnit: 'gal' },
  'liter to gallon': { fromUnit: 'L', toUnit: 'gal' },
  'liters to gallon': { fromUnit: 'L', toUnit: 'gal' },
  'l to gallons': { fromUnit: 'L', toUnit: 'gal' },
  'L to gallons': { fromUnit: 'L', toUnit: 'gal' },
  'liter to gallons': { fromUnit: 'L', toUnit: 'gal' },
  'liters to gallons': { fromUnit: 'L', toUnit: 'gal' },
  
  'gal to l': { fromUnit: 'gal', toUnit: 'L' },
  'gal to L': { fromUnit: 'gal', toUnit: 'L' },
  'gallon to l': { fromUnit: 'gal', toUnit: 'L' },
  'gallons to l': { fromUnit: 'gal', toUnit: 'L' },
  'gallon to L': { fromUnit: 'gal', toUnit: 'L' },
  'gallons to L': { fromUnit: 'gal', toUnit: 'L' },
  'gal to liter': { fromUnit: 'gal', toUnit: 'L' },
  'gallon to liter': { fromUnit: 'gal', toUnit: 'L' },
  'gallons to liter': { fromUnit: 'gal', toUnit: 'L' },
  'gal to liters': { fromUnit: 'gal', toUnit: 'L' },
  'gallon to liters': { fromUnit: 'gal', toUnit: 'L' },
  'gallons to liters': { fromUnit: 'gal', toUnit: 'L' },
  
  '°C to °F': { fromUnit: 'degC', toUnit: 'degF' },
  'C to F': { fromUnit: 'degC', toUnit: 'degF' },
  'celsius to fahrenheit': { fromUnit: 'degC', toUnit: 'degF' },
  'c to f': { fromUnit: 'degC', toUnit: 'degF' },
  'degC to degF': { fromUnit: 'degC', toUnit: 'degF' },
  
  '°F to °C': { fromUnit: 'degF', toUnit: 'degC' },
  'F to C': { fromUnit: 'degF', toUnit: 'degC' },
  'fahrenheit to celsius': { fromUnit: 'degF', toUnit: 'degC' },
  'f to c': { fromUnit: 'degF', toUnit: 'degC' },
  'degF to degC': { fromUnit: 'degF', toUnit: 'degC' },
};

// Create a custom math.js instance with configuration
const mathInstance = math.create(math.all);

// Configure math.js with complex number support
mathInstance.config({
  number: 'number',
  precision: 14
});

// Add complex number helper function to scope
const complexFn = mathInstance.evaluate('complex');
const powFn = mathInstance.evaluate('pow');

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
  const scope: Record<string, any> = { 
    ...variables,
    // Add complex number support
    complex: complexFn,
    pow: powFn,
    i: complexFn(0, 1), // Add i directly to the scope so i can be used directly
    // Add default angle mode
    angleMode: angleMode === 'DEG' ? 'deg' : 'rad'
  };

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
    
    // Add support for complex numbers i/j notation
    // First, pre-process common complex number patterns
    let processedValueExpr = valueExpression;
    
    // Pre-process complex number inputs for better handling
    const imgUnitRegex = /(\d*\.?\d*)i\b/g;
    processedValueExpr = processedValueExpr.replace(imgUnitRegex, (match, num) => {
      if (num === '') return 'complex(0, 1)';  // just i becomes complex(0, 1)
      return `complex(0, ${num})`;            // 5i becomes complex(0, 5)
    });
    
    // Handle pre-multipliers of i: 5*i becomes complex(0, 5)
    processedValueExpr = processedValueExpr.replace(/(\d+\.?\d*)\s*\*\s*i\b/g, 'complex(0, $1)');
    
    // Define a custom function to handle degrees in our scope
    if (angleMode === 'DEG') {
      // Add degree conversion functions to scope
      scope.deg2rad = (degrees: number) => degrees * Math.PI / 180;
      scope.rad2deg = (radians: number) => radians * 180 / Math.PI;
      
      // Handle special degree notation like sin(90 deg) or cos(45 rad)
      processedValueExpr = processedValueExpr.replace(/(\d+(\.\d+)?)\s*deg/g, (match, num) => {
        return num;
      });
      
      processedValueExpr = processedValueExpr.replace(/(\d+(\.\d+)?)\s*rad/g, (match, num) => {
        return `(${num} * 180 / ${Math.PI})`;
      });
      
      try {
        // First, only transform specific patterns for trig functions
        // Regular trig functions - process these individually
        processedValueExpr = processedValueExpr
          .replace(/\bsin\s*\(([^)]+)\)/g, (match, inner) => `sin(deg2rad(${inner}))`)
          .replace(/\bcos\s*\(([^)]+)\)/g, (match, inner) => `cos(deg2rad(${inner}))`)
          .replace(/\btan\s*\(([^)]+)\)/g, (match, inner) => `tan(deg2rad(${inner}))`);
        
        // Handle inverse trig functions - process each pattern individually
        processedValueExpr = processedValueExpr
          .replace(/\barcsin\s*\(([^)]+)\)/g, (match, inner) => `rad2deg(asin(${inner}))`)
          .replace(/\barccos\s*\(([^)]+)\)/g, (match, inner) => `rad2deg(acos(${inner}))`)
          .replace(/\barctan\s*\(([^)]+)\)/g, (match, inner) => `rad2deg(atan(${inner}))`);
        
        // Then handle asin/acos/atan forms
        processedValueExpr = processedValueExpr
          .replace(/\basin\s*\(([^)]+)\)/g, (match, inner) => `rad2deg(asin(${inner}))`)
          .replace(/\bacos\s*\(([^)]+)\)/g, (match, inner) => `rad2deg(acos(${inner}))`)
          .replace(/\batan\s*\(([^)]+)\)/g, (match, inner) => `rad2deg(atan(${inner}))`);
      } catch (e) {
        // Fallback to simpler approach if regex fails
        if (processedValueExpr.includes('arctan')) {
          processedValueExpr = processedValueExpr.replace(/arctan/g, 'atan');
        }
        if (processedValueExpr.includes('arcsin')) {
          processedValueExpr = processedValueExpr.replace(/arcsin/g, 'asin');
        }
        if (processedValueExpr.includes('arccos')) {
          processedValueExpr = processedValueExpr.replace(/arccos/g, 'acos');
        }
      }
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
    
    // Add support for complex numbers i/j notation
    // Pre-process complex number inputs for better handling
    const imgUnitRegex = /(\d*\.?\d*)i\b/g;
    processedExpression = processedExpression.replace(imgUnitRegex, (match, num) => {
      if (num === '') return 'complex(0, 1)';  // just i becomes complex(0, 1)
      return `complex(0, ${num})`;            // 5i becomes complex(0, 5)
    });
    
    // Handle pre-multipliers of i: 5*i becomes complex(0, 5)
    processedExpression = processedExpression.replace(/(\d+\.?\d*)\s*\*\s*i\b/g, 'complex(0, $1)');
    
    // Define a custom function to handle degrees in our scope
    if (angleMode === 'DEG') {
      // Add degree conversion functions to scope
      scope.deg2rad = (degrees: number) => degrees * Math.PI / 180;
      scope.rad2deg = (radians: number) => radians * 180 / Math.PI;
      
      // Handle special degree notation like sin(90 deg) or cos(45 rad)
      processedExpression = processedExpression.replace(/(\d+(\.\d+)?)\s*deg/g, (match, num) => {
        return num;
      });
      
      processedExpression = processedExpression.replace(/(\d+(\.\d+)?)\s*rad/g, (match, num) => {
        return `(${num} * 180 / ${Math.PI})`;
      });
      
      // Handle trig functions with careful parenthesis balancing
      // Store original expression for debugging
      const origExpr = processedExpression;
      
      try {
        // First, only transform specific patterns for trig functions
        // Use a more careful approach that doesn't mess up all parentheses
        
        // Regular trig functions - process these individually
        processedExpression = processedExpression
          .replace(/\bsin\s*\(([^)]+)\)/g, (match, inner) => `sin(deg2rad(${inner}))`)
          .replace(/\bcos\s*\(([^)]+)\)/g, (match, inner) => `cos(deg2rad(${inner}))`)
          .replace(/\btan\s*\(([^)]+)\)/g, (match, inner) => `tan(deg2rad(${inner}))`);
        
        // Handle inverse trig functions - process each pattern individually
        processedExpression = processedExpression
          .replace(/\barcsin\s*\(([^)]+)\)/g, (match, inner) => `rad2deg(asin(${inner}))`)
          .replace(/\barccos\s*\(([^)]+)\)/g, (match, inner) => `rad2deg(acos(${inner}))`)
          .replace(/\barctan\s*\(([^)]+)\)/g, (match, inner) => `rad2deg(atan(${inner}))`);
        
        // Then handle asin/acos/atan forms
        processedExpression = processedExpression
          .replace(/\basin\s*\(([^)]+)\)/g, (match, inner) => `rad2deg(asin(${inner}))`)
          .replace(/\bacos\s*\(([^)]+)\)/g, (match, inner) => `rad2deg(acos(${inner}))`)
          .replace(/\batan\s*\(([^)]+)\)/g, (match, inner) => `rad2deg(atan(${inner}))`);
      } catch (e) {
        // If anything goes wrong with regex, revert to original expression
        processedExpression = origExpr;
        // Just use basic function replacements
        if (processedExpression.includes('arctan')) {
          processedExpression = processedExpression.replace(/arctan/g, 'atan');
        }
        if (processedExpression.includes('arcsin')) {
          processedExpression = processedExpression.replace(/arcsin/g, 'asin');
        }
        if (processedExpression.includes('arccos')) {
          processedExpression = processedExpression.replace(/arccos/g, 'acos');
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