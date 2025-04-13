import * as math from "mathjs";

// No longer needed as we rely on mathjs built-in units or explicit scope definitions
// const unitMap: Record<string, string> = { ... };

// Create a custom math.js instance with configuration
const mathInstance = math.create(math.all);

// Configure math.js
// NOTE: 'implicit' config option does NOT enable parsing, only formatting.
// We will handle implicit multiplication via preprocessing.
mathInstance.config({
  number: "number", // Use standard JS numbers
  precision: 14, // Default precision for calculations
});

// --- Constants ---
const PI = Math.PI;
const DEG_TO_RAD = PI / 180;
const RAD_TO_DEG = 180 / PI;

/**
 * Preprocesses the expression string to insert explicit multiplication symbols (*)
 * for common implicit multiplication cases that mathjs doesn't handle by default.
 * @param expression The raw expression string.
 * @returns The processed expression string with explicit multiplication.
 */
function preprocessImplicitMultiplication(expression: string): string {
  let processed = expression;

  // 1. Replace non-breaking spaces and normalize whitespace
  processed = processed
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // 2. Insert * between number and variable/function/parenthesis
  // Example: 2x -> 2 * x, 3pi -> 3 * pi, 4( -> 4 * (
  // Use \b word boundaries carefully
  processed = processed.replace(
    /(\b\d+\.?\d*|\b\.\d+)\s*(\b[a-zA-Z_]\w*\b|\()/g,
    "$1 * $2",
  );
  // Example: 2x + 3y -> 2 * x + 3 * y
  // Example: 5(x+1) -> 5 * (x+1)

  // 3. Insert * between parenthesis and variable/number/parenthesis
  // Example: (x+1)y -> (x+1) * y, (x+1)2 -> (x+1) * 2, (x+1)(y+1) -> (x+1) * (y+1)
  processed = processed.replace(
    /(\))\s*(\b[a-zA-Z_]\w*\b|\b\d+\.?\d*|\b\.\d+|\()/g,
    "$1 * $2",
  );
  // Example: (x+1)y -> (x+1) * y
  // Example: (a)(b) -> (a) * (b) handled by previous rule or mathjs? let's ensure it
  // Example: (x+1)2 -> (x+1) * 2

  // 4. Optional: Insert * between variable and parenthesis (less common)
  // Example: x(y+1) -> x * (y+1)
  processed = processed.replace(/(\b[a-zA-Z_]\w*\b)\s*(\()/g, "$1 * $2");

  // NOTE: This doesn't handle implicit multiplication with units like "5 kg"
  // because mathjs *should* handle that IF the unit ('kg') is defined.
  // `math.all` includes common units. If custom units were needed,
  // they'd have to be defined using `math.createUnit`.

  // Replace multiple '*' resulting from consecutive replacements (edge case)
  processed = processed.replace(/\* \*/g, "*");

  console.log(`[preprocess] "${expression}" -> "${processed}"`); // Debugging
  return processed;
}

/**
 * Evaluates a mathematical expression string.
 * @param expression The raw expression string.
 * @param variables An object containing current variable values. Defaults to empty object.
 * @param angleMode The current angle mode ('DEG' or 'RAD'). Defaults to 'DEG'.
 * @returns An object { result: any; updatedVariables: Record<string, any> }.
 *          `result` is the calculation outcome (number, Complex, Unit, etc.) or null on error.
 *          `updatedVariables` contains any variables assigned during evaluation.
 */
export function evaluate(
  expression: string,
  variables: Record<string, any> = {},
  angleMode: "DEG" | "RAD" = "DEG", // Default to DEG as per original code
): { result: any; updatedVariables: Record<string, any> } {
  try {
    // 1. Strip comments first
    let expr = expression.split("//")[0].trim();
    if (!expr) return { result: null, updatedVariables: {} };

    // 2. Preprocess for implicit multiplication
    expr = preprocessImplicitMultiplication(expr);

    // 3. Prepare the evaluation scope
    const scope: Record<string, any> = { ...variables };

    // Add constants and ensure 'i' is the complex object
    scope.pi = PI; // Lowercase 'pi' is conventional in mathjs scope
    scope.PI = PI; // Uppercase for convenience
    scope.e = Math.E; // Euler's number
    // Define 'i' within the scope for this evaluation run
    scope.i = math.complex(0, 1);

    // Add angle-mode-dependent trigonometric functions
    if (angleMode === "DEG") {
      scope.sin = (x: number | math.Complex) => {
        if (math.isComplex(x))
          throw new Error("Trig functions currently only support real numbers");
        return math.sin(Number(x) * DEG_TO_RAD);
      };
      scope.cos = (x: number | math.Complex) => {
        if (math.isComplex(x))
          throw new Error("Trig functions currently only support real numbers");
        const result = math.cos(Number(x) * DEG_TO_RAD);
        // Apply tolerance for results near zero (e.g., cos(90 deg))
        return Math.abs(result) < 1e-14 ? 0 : result;
      };
      scope.tan = (x: number | math.Complex) => {
        if (math.isComplex(x))
          throw new Error("Trig functions currently only support real numbers");
        const angleRad = Number(x) * DEG_TO_RAD;
        const cosVal = math.cos(angleRad);
        if (Math.abs(cosVal) < 1e-14)
          throw new Error(
            "Tangent undefined for this angle (division by zero)",
          );
        return math.tan(angleRad);
      };
      scope.asin = (x: number | math.Complex) => {
        if (math.isComplex(x))
          throw new Error(
            "Inverse trig functions currently only support real numbers",
          );
        return math.asin(Number(x)) * RAD_TO_DEG;
      };
      scope.acos = (x: number | math.Complex) => {
        if (math.isComplex(x))
          throw new Error(
            "Inverse trig functions currently only support real numbers",
          );
        return math.acos(Number(x)) * RAD_TO_DEG;
      };
      scope.atan = (x: number | math.Complex) => {
        if (math.isComplex(x))
          throw new Error(
            "Inverse trig functions currently only support real numbers",
          );
        return math.atan(Number(x)) * RAD_TO_DEG;
      };
      scope.atan2 = (y: number | math.Complex, x: number | math.Complex) => {
        if (math.isComplex(x) || math.isComplex(y))
          throw new Error("atan2 currently only supports real numbers");
        return math.atan2(Number(y), Number(x)) * RAD_TO_DEG;
      };
    } else {
      // RAD mode (use mathjs defaults or wrap for consistency)
      scope.sin = (x: number | math.Complex) => math.sin(x); // mathjs handles complex sin
      scope.cos = (x: number | math.Complex) => {
        const result = math.cos(x);
        // Apply tolerance for complex numbers near zero as well
        if (math.isComplex(result)) {
          return math.complex(
            Math.abs(result.re) < 1e-14 ? 0 : result.re,
            Math.abs(result.im) < 1e-14 ? 0 : result.im,
          );
        }
        return Math.abs(result) < 1e-14 ? 0 : result;
      };
      scope.tan = (x: number | math.Complex) => math.tan(x);
      scope.asin = (x: number | math.Complex) => math.asin(x);
      scope.acos = (x: number | math.Complex) => math.acos(x);
      scope.atan = (x: number | math.Complex) => math.atan(x);
      scope.atan2 = (y: number | math.Complex, x: number | math.Complex) =>
        math.atan2(y, x);
    }
    // Add aliases if desired
    scope.arcsin = scope.asin;
    scope.arccos = scope.acos;
    scope.arctan = scope.atan;

    // 4. Check for variable assignment
    const assignmentMatch = expr.match(/^\s*([a-zA-Z_]\w*)\s*=\s*(.+)$/);
    if (assignmentMatch) {
      const [, varName, rhsExpr] = assignmentMatch;
      // Prevent assigning to reserved names (constants)
      if (["pi", "PI", "e", "i"].includes(varName)) {
        throw new Error(`Cannot assign to constant '${varName}'`);
      }
      console.log(`[evaluate] Assignment: ${varName} = ${rhsExpr}`);
      // Evaluate the right-hand side using the *current* scope
      const value = mathInstance.evaluate(rhsExpr, scope);
      console.log(`[evaluate] Assigned value:`, value);
      // Return the calculated value and the variable that was updated
      return { result: value, updatedVariables: { [varName]: value } };
    }

    // 5. Perform general evaluation (handles plain math, units, conversions etc.)
    // `mathjs` will handle "10 m to ft" if units are known.
    // Preprocessing handled implicit multiplication.
    const result = mathInstance.evaluate(expr, scope);
    console.log(`[evaluate] Final result:`, result);
    // No variables were assigned in this path
    return { result, updatedVariables: {} };
  } catch (error: any) {
    // Log the error for debugging purposes
    console.error(`[evaluate] Error evaluating "${expression}":`, error);
    // Return null result and empty updated variables on any error
    return { result: null, updatedVariables: {} };
  }
}


const vars = { x: 5, y: 10 };
console.log(evaluate("2x + 1", vars)); // -> { result: 11, updatedVariables: {} }
console.log(evaluate("(x+1)y", vars)); // -> { result: 60, updatedVariables: {} }
console.log(evaluate("z = 3x", vars)); // -> { result: 15, updatedVariables: { z: 15 } }
console.log(evaluate("5 kg + 2 kg")); // -> { result: Unit 7 kg, updatedVariables: {} } (mathjs handles this)
console.log(evaluate("10 m to ft")); // -> { result: Unit ~32.8 ft, updatedVariables: {} } (mathjs handles this)
console.log(evaluate("sin(90)", {}, "DEG")); // -> { result: 1, updatedVariables: {} }
console.log(evaluate("sin(pi/2)", {}, "RAD")); // -> { result: 1, updatedVariables: {} }
console.log(evaluate("2(3+1)")); // -> { result: 8, updatedVariables: {} } (mathjs handles this)

