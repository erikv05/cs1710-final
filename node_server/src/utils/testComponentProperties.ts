import { Project, SyntaxKind, Node, IfStatement } from "ts-morph";
import { PBTAssertion, TextPBTAssertion, LabelPBTAssertion } from "../types/PropertyDefinition";
import { ReactParseResult, AssertionSet } from "../types/SolverRequest";
import { Branch, Literal, Transition } from "../types/SolverRequest";

interface Condition {
  stateVar: string;
  value: boolean;
}

// New validation interfaces and classes
interface ValidationError {
  message: string;
  assertionName?: string;
  errorType: 'STATE_VARIABLE' | 'ASSERTION_FORMAT' | 'CNF_FORMAT' | 'GENERAL';
}

class ValidationResult {
  valid: boolean;
  errors: ValidationError[];

  constructor() {
    this.valid = true;
    this.errors = [];
  }

  addError(error: ValidationError) {
    this.valid = false;
    this.errors.push(error);
  }
}

// Define a handler interface for processing different assertion types
interface AssertionHandler {
  canHandle(assertion: PBTAssertion): boolean;
  evaluate(assertion: PBTAssertion, content: string): boolean;
}

// Handler for TextPBTAssertion
class TextAssertionHandler implements AssertionHandler {
  canHandle(assertion: PBTAssertion): boolean {
    return 'textToFind' in assertion;
  }

  evaluate(assertion: PBTAssertion, content: string): boolean {
    const textAssertion = assertion as TextPBTAssertion;
    return content.includes(textAssertion.textToFind);
  }
}

// Handler for LabelPBTAssertion
class LabelAssertionHandler implements AssertionHandler {
  canHandle(assertion: PBTAssertion): boolean {
    return 'labelToFind' in assertion;
  }

  evaluate(assertion: PBTAssertion, content: string): boolean {
    const labelAssertion = assertion as LabelPBTAssertion;
    const labelToFind = labelAssertion.labelToFind;
    
    // Check for various forms of essibility attributes
    return content.includes(`aria-label="${labelToFind}"`) || 
           content.includes(`aria-label='${labelToFind}'`) ||
           content.includes(`aria-labelledby="${labelToFind}"`) ||
           content.includes(`aria-labelledby='${labelToFind}'`) ||
           content.includes(`role="${labelToFind}"`) ||
           content.includes(`role='${labelToFind}'`) || 
           content.includes(`id="${labelToFind}"`) ||
           content.includes(`id='${labelToFind}'`) ||
           content.includes(`data-testid="${labelToFind}"`) ||
           content.includes(`data-testid='${labelToFind}'`);
  }
}

// Registry of handlers
const assertionHandlers: AssertionHandler[] = [
  new TextAssertionHandler(),
  new LabelAssertionHandler(),
];

// Gang of four would be proud
function processAssertion(assertion: PBTAssertion, content: string): boolean {
  for (const handler of assertionHandlers) {
    if (handler.canHandle(assertion)) {
      return handler.evaluate(assertion, content);
    }
  }
  console.warn(`No handler found for assertion type: ${assertion.name}`);
  return false;
}

// New validation functions
function validateAssertionFormat(properties: PBTAssertion[]): ValidationResult {
  const result = new ValidationResult();

  properties.forEach(property => {
    if (!property.rhs) return;

    // Check format of assertions
    property.rhs.forEach(clause => {
      clause.forEach(lit => {
        // The assertion must be either the name or !name
        if (lit.name !== property.name && lit.name !== property.name.replace(/^!/, '')) {
          result.addError({
            message: `Invalid assertion format. Expected "${property.name}" or "!${property.name}", got "${lit.name}"`,
            assertionName: property.name,
            errorType: 'ASSERTION_FORMAT'
          });
        }
      });
    });
  });

  return result;
}

function validateStateVariables(properties: PBTAssertion[], stateVars: string[]): ValidationResult {
  const result = new ValidationResult();
  const stateVarSet = new Set(stateVars);

  // Check for each property
  properties.forEach(property => {
    // First check LHS (preconditions)
    if (property.lhs) {
      property.lhs.forEach(clause => {
        clause.forEach(lit => {
          // Skip default placeholder variables that might be added for empty conditions
          if (lit.name === 'default') return;
          
          if (!stateVarSet.has(lit.name)) {
            result.addError({
              message: `State variable "${lit.name}" used in condition does not exist in the component`,
              assertionName: property.name,
              errorType: 'STATE_VARIABLE'
            });
          }
        });
      });
    }
  });

  return result;
}

function validateCNF(properties: PBTAssertion[]): ValidationResult {
  const result = new ValidationResult();
  
  // Validating CNF structure is complex and would involve custom logic
  // This is a simplified check
  
  properties.forEach(property => {
    // Check LHS format (must be an array of arrays of literals)
    if (!Array.isArray(property.lhs)) {
      result.addError({
        message: `Precondition for "${property.name}" is not in CNF format`,
        assertionName: property.name,
        errorType: 'CNF_FORMAT'
      });
    } else {
      property.lhs.forEach((clause, i) => {
        if (!Array.isArray(clause)) {
          result.addError({
            message: `Clause ${i+1} in precondition for "${property.name}" is not an array`,
            assertionName: property.name,
            errorType: 'CNF_FORMAT'
          });
        }
      });
    }
    
    // Check RHS format
    if (!Array.isArray(property.rhs)) {
      result.addError({
        message: `Assertion for "${property.name}" is not in CNF format`,
        assertionName: property.name,
        errorType: 'CNF_FORMAT'
      });
    } else {
      property.rhs.forEach((clause, i) => {
        if (!Array.isArray(clause)) {
          result.addError({
            message: `Clause ${i+1} in assertion for "${property.name}" is not an array`,
            assertionName: property.name,
            errorType: 'CNF_FORMAT'
          });
        }
      });
    }
  });
  
  return result;
}

export function parseReactComponent(
  filePath: string, 
  properties: PBTAssertion[]
): ReactParseResult {
  const project = new Project({ tsConfigFilePath: "tsconfig.json" });
  const sourceFile = project.addSourceFileAtPath(filePath);
  
  const ifStatements = sourceFile.getDescendantsOfKind(SyntaxKind.IfStatement);
  
  const uniqueStateVars = new Set<string>();
  const branches: Branch[] = [];
  
  // Extract property names for pbt_variables
  const pbtVariables = new Set<string>();
  properties.forEach(prop => {
    pbtVariables.add(prop.name);
    // Add any variables used in assertions
    if (prop.rhs) {
      prop.rhs.forEach(clause => {
        clause.forEach(lit => pbtVariables.add(lit.name));
      });
    }
  });
  
  // Scan entire file for useState hooks to build a mapping of setters to state variables
  const stateSetterMap = extractUseStateHooks(sourceFile);
  
  // Add all state variables to uniqueStateVars
  for (const [_, stateVar] of stateSetterMap.entries()) {
    uniqueStateVars.add(stateVar);
  }
  
  // Only process top-level if statements (not nested in other if-else chains)
  const topLevelIfStatements = ifStatements.filter(ifStmt => {
    // Check if this if statement is not contained within another if statement
    const ancestors = ifStmt.getAncestors();
    return !ancestors.some(ancestor => Node.isIfStatement(ancestor));
  });
  
  for (const ifStmt of topLevelIfStatements) {
    if (ifStmt.getParent()?.getKind() === SyntaxKind.CaseClause) continue;
    
    // Process the entire if-else-if chain
    processIfElseChain(ifStmt, stateSetterMap, properties, branches, uniqueStateVars);
  }

  const assertions: AssertionSet[] = []

  properties.forEach(property => {
    assertions.push({
      preconditionals: property.lhs,
      pbt_assertions: {
        name: property.name,
        cnf: property.rhs
      }
    })
  })

  
  // Create a single result with all the information
  const result: ReactParseResult = {
    state_variables: Array.from(uniqueStateVars),
    pbt_variables: Array.from(pbtVariables),
    branches,
    assertions
  };
  
  return result;
}

// Process an if-else-if chain and add its branches
function processIfElseChain(
  ifStmt: IfStatement, 
  stateSetterMap: Map<string, string>,
  properties: PBTAssertion[],
  branches: Branch[],
  uniqueStateVars: Set<string>
): void {
  let currentIf: IfStatement | undefined = ifStmt;
  
  while (currentIf) {
    if (Node.isIfStatement(currentIf)) {
      const cnfConditions = extractConditionsInCNF(currentIf.getExpression());
      
      // Collect unique state variables
      for (const clause of cnfConditions) {
        for (const condition of clause) {
          uniqueStateVars.add(condition.stateVar);
        }
      }
      
      // Handle the then branch
      const thenStatement = currentIf.getThenStatement();
      const thenText = thenStatement.getText();
      
      // Extract JSX return statement content
      const thenJsxContent = extractJsxReturnContent(thenText);
      
      // Convert conditions to CNF format for the Branch
      const conditionLiterals = cnfConditions.map(clause => 
        clause.map(cond => ({
          name: cond.stateVar,
          assignment: cond.value
        }))
      );
      
      // Process each property with appropriate handler
      const implications: Literal[] = [];
      for (const property of properties) {
        implications.push({
          name: property.name,
          assignment: processAssertion(property, thenText)
        });
      }
      
      // Extract state transitions from the rendered component
      // Pass both the full content and the JSX content
      const transitions = extractStateTransitions(thenJsxContent || thenText, stateSetterMap);
      
      branches.push({
        conditions: conditionLiterals, 
        implications,
        transitions
      });
      
      const elseStatement: Node | undefined = currentIf.getElseStatement();
      if (elseStatement && Node.isIfStatement(elseStatement)) {
        // Continue with the next if in the else-if chain
        currentIf = elseStatement;
      } else if (elseStatement) {
        // Handle the final else clause
        const elseText = elseStatement.getText();
        
        // Extract JSX return statement content
        const elseJsxContent = extractJsxReturnContent(elseText);
        
        // For the else clause, the conditions are the negation of all conditions in the chain
        // For simplicity, we represent it as an empty conditions array
        const elseImplications: Literal[] = [];
        for (const property of properties) {
          elseImplications.push({
            name: property.name,
            assignment: processAssertion(property, elseText)
          });
        }
        
        // Extract state transitions from the else clause
        const elseTransitions = extractStateTransitions(elseJsxContent || elseText, stateSetterMap);
        
        branches.push({
          conditions: [], // Empty conditions for else branch
          implications: elseImplications,
          transitions: elseTransitions
        });
        
        // End the chain after processing the else clause
        currentIf = undefined;
      } else {
        // No else clause, end the chain
        currentIf = undefined;
      }
    } else {
      currentIf = undefined;
    }
  }
}

// Helper to extract JSX from return statements
function extractJsxReturnContent(text: string): string | null {
  // Pattern to match return (<JSX>...</JSX>);
  const returnRegex = /return\s*\(\s*([\s\S]*?)\s*\);/;
  const match = text.match(returnRegex);
  return match ? match[1] : null;
}

// Extract useState hooks and create a mapping of setter functions to their state variables
function extractUseStateHooks(sourceFile: Node): Map<string, string> {
  const stateSetterMap = new Map<string, string>();
  
  // Find all useState declarations
  const useStateDeclarations = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression)
    .filter(call => {
      const expression = call.getExpression();
      return Node.isIdentifier(expression) && expression.getText() === 'useState';
    });
  
  for (const useStateCall of useStateDeclarations) {
    // Look for parent destructuring pattern
    const parent = useStateCall.getParent();
    if (parent && Node.isArrayLiteralExpression(parent)) {
      const grandParent = parent.getParent();
      if (grandParent && Node.isVariableDeclaration(grandParent)) {
        const destructuredNames = grandParent.getNameNode();
        if (Node.isArrayBindingPattern(destructuredNames)) {
          const elements = destructuredNames.getElements();
          if (elements.length >= 2) {
            // Handle cases where there might be type annotations on the state variable
            let stateVar = elements[0].getText().trim();
            // Remove type annotations if present
            if (stateVar.includes(':')) {
              stateVar = stateVar.split(':')[0].trim();
            }
            
            let stateSetter = elements[1].getText().trim();
            // Remove type annotations if present
            if (stateSetter.includes(':')) {
              stateSetter = stateSetter.split(':')[0].trim();
            }
            
            stateSetterMap.set(stateSetter, stateVar);
          }
        }
      }
    }
  }
  
  // Also check for useState calls with direct assignment (const count = useState(0)[0])
  const variableDeclarations = sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration);
  for (const declaration of variableDeclarations) {
    const initializer = declaration.getInitializer();
    if (initializer && Node.isElementAccessExpression(initializer)) {
      const expression = initializer.getExpression();
      if (Node.isCallExpression(expression)) {
        const callee = expression.getExpression();
        if (Node.isIdentifier(callee) && callee.getText() === 'useState') {
          // This is a useState call with direct array access
          const varName = declaration.getName();
          // For direct access, we may not have a setter mapping, but we still want to record the state var
          stateSetterMap.set(`set${varName.charAt(0).toUpperCase() + varName.slice(1)}`, varName);
        }
      }
    }
  }
  
  return stateSetterMap;
}

// Extract state transitions from component content
function extractStateTransitions(content: string, stateSetterMap: Map<string, string>): Transition[] {
  const transitions: Transition[] = [];
  const processed = new Set<string>(); // Track processed state variables to avoid duplicates
  
  // Need access to full component - find the root source file
  // We assume the content is from a React component
  const fullComponentContent = content;
  
  // For each setter function in our map
  for (const [setter, stateVar] of stateSetterMap.entries()) {
    // Skip if we've already processed this state variable
    if (processed.has(stateVar)) continue;
    
    // Track potential assignments
    const assignments: boolean[] = [];
    
    // Look for direct onClick handlers with setter
    if (content.includes(`onClick={() => ${setter}(false)`) ||
        content.includes(`onClick={()=>${setter}(false)`) ||
        content.includes(`onClick={ () => ${setter}(false)`) ||
        content.includes(`onClick={ ()=>${setter}(false)`)) {
      assignments.push(false);
    }
    
    if (content.includes(`onClick={() => ${setter}(true)`) ||
        content.includes(`onClick={()=>${setter}(true)`) ||
        content.includes(`onClick={ () => ${setter}(true)`) ||
        content.includes(`onClick={ ()=>${setter}(true)`)) {
      assignments.push(true);
    }
    
    // Look for function references in onClick handlers
    const onClickRegex = /onClick=\{([^}]+)\}/g;
    let match;
    while ((match = onClickRegex.exec(content)) !== null) {
      const functionName = match[1].trim();
      
      // Skip arrow functions
      if (functionName.includes('=>')) continue;
      
      // Check if there's a function definition with this name
      const funcDefRegex = new RegExp(`const\\s+${functionName}\\s*=\\s*\\(.*?\\)\\s*=>\\s*\\{([\\s\\S]*?)\\};`);
      const funcMatch = fullComponentContent.match(funcDefRegex);
      
      if (funcMatch && funcMatch[1]) {
        const funcBody = funcMatch[1];
        
        // Check if the function uses this setter
        if (funcBody.includes(setter)) {
          if (funcBody.includes(`${setter}(true)`) || 
              funcBody.includes(`${setter}(true);`)) {
            assignments.push(true);
          }
          else if (funcBody.includes(`${setter}(false)`) || 
                  funcBody.includes(`${setter}(false);`)) {
            assignments.push(false);
          }
          else if (funcBody.includes(`${setter}(prevMode =>`) || 
                  funcBody.includes(`${setter}(prev =>`) ||
                  funcBody.includes(`${setter}(!`) ||
                  funcBody.includes(`!prevMode`) ||
                  funcBody.includes(`!prev`)) {
            // Toggle pattern - include both possible values
            if (!assignments.includes(true)) assignments.push(true);
            if (!assignments.includes(false)) assignments.push(false);
          }
          else {
            // Function uses setter but we can't determine how, include both
            if (!assignments.includes(true)) assignments.push(true);
            if (!assignments.includes(false)) assignments.push(false);
          }
        }
      }
    }
    
    // If we found assignments for this state variable, add a transition
    if (assignments.length > 0) {
      transitions.push({
        name: stateVar,
        assignments
      });
      
      // Mark as processed
      processed.add(stateVar);
    }
  }
  
  return transitions;
}

// Extract conditions in Conjunctive Normal Form (CNF)
function extractConditionsInCNF(expression: Node): Condition[][] {
  // Base case for single literals
  if (Node.isIdentifier(expression)) {
    return [[{ stateVar: expression.getText(), value: true }]];
  }
  
  // Handle negation (!)
  if (Node.isPrefixUnaryExpression(expression) && 
      expression.getOperatorToken() === SyntaxKind.ExclamationToken) {
    const operand = expression.getOperand();
    if (Node.isIdentifier(operand)) {
      return [[{ stateVar: operand.getText(), value: false }]];
    }
  }
  
  // Handle binary expressions
  if (Node.isBinaryExpression(expression)) {
    const operator = expression.getOperatorToken().getText();
    
    // Handle AND (&&) - combine clauses from left and right
    if (operator === "&&") {
      const leftCNF = extractConditionsInCNF(expression.getLeft());
      const rightCNF = extractConditionsInCNF(expression.getRight());
      return [...leftCNF, ...rightCNF];
    }
    
    // Handle OR (||) - create a new clause with all literals from left and right
    if (operator === "||") {
      const leftCNF = extractConditionsInCNF(expression.getLeft());
      const rightCNF = extractConditionsInCNF(expression.getRight());
      
      // For CNF, we assume OR operations are contained within a single clause
      // This assumes the input is already in CNF
      const mergedClause: Condition[] = [];
      
      // Since we're assuming CNF, both leftCNF and rightCNF should have a single clause
      if (leftCNF.length === 1 && rightCNF.length === 1) {
        return [[...leftCNF[0], ...rightCNF[0]]];
      }
    }
  }
  
  console.warn("Warning: Expression may not be in proper CNF:", expression.getText());
  return [[]]; // Return empty clause as fallback
}

// Extract transitions by analyzing the entire component file
export function scanComponentTransitions(filePath: string): { [branch: number]: Transition[] } {
  const fs = require('fs');
  const path = require('path');
  
  // Read the component file
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Find state variables and their setters
  const stateSetterMap = new Map<string, string>();
  
  // Extract useState declarations - first approach with standard pattern
  const useStateRegex = /const\s+\[\s*(\w+)(?:\s*:\s*[^,]*)?\s*,\s*(\w+)(?:\s*:\s*[^,]*)?\s*\]\s*=\s*useState/g;
  let match;
  
  while ((match = useStateRegex.exec(content)) !== null) {
    const stateVar = match[1];
    const setter = match[2];
    stateSetterMap.set(setter, stateVar);
  }
  
  // Extract useState with direct access (const count = useState(0)[0])
  const directAccessRegex = /const\s+(\w+)(?:\s*:\s*[^=]*)?\s*=\s*useState\([^)]*\)\[0\]/g;
  while ((match = directAccessRegex.exec(content)) !== null) {
    const stateVar = match[1];
    // Simulate a setter name based on convention
    const setter = `set${stateVar.charAt(0).toUpperCase() + stateVar.slice(1)}`;
    stateSetterMap.set(setter, stateVar);
  }
  
  // Find all JSX return statements
  const returnRegex = /return\s*\(\s*([\s\S]*?)\s*\);/g;
  let branchIndex = 0;
  const branchTransitions: { [branch: number]: Transition[] } = {};
  
  while ((match = returnRegex.exec(content)) !== null) {
    branchIndex++;
    const jsxContent = match[1];
    const transitions: Transition[] = [];
    
    // Check for each state setter
    for (const [setter, stateVar] of stateSetterMap.entries()) {
      // Track potential assignments
      const assignments: boolean[] = [];
      
      // Check for onClick handlers with direct setter calls
      if (jsxContent.includes(`onClick={() => ${setter}(false)`) ||
          jsxContent.includes(`onClick={()=>${setter}(false)`) ||
          jsxContent.includes(`onClick={ () => ${setter}(false)`) ||
          jsxContent.includes(`onClick={ ()=>${setter}(false)`)) {
        assignments.push(false);
      }
      
      if (jsxContent.includes(`onClick={() => ${setter}(true)`) ||
          jsxContent.includes(`onClick={()=>${setter}(true)`) ||
          jsxContent.includes(`onClick={ () => ${setter}(true)`) ||
          jsxContent.includes(`onClick={ ()=>${setter}(true)`)) {
        assignments.push(true);
      }
      
      // Check for function references in onClick handlers
      const onClickRegex = /onClick=\{([^}]+)\}/g;
      let functionMatch;
      
      while ((functionMatch = onClickRegex.exec(jsxContent)) !== null) {
        const functionName = functionMatch[1].trim();
        
        // Skip arrow functions
        if (functionName.includes('=>')) continue;
        
        // Find function definition
        const funcDefRegex = new RegExp(`const\\s+${functionName}\\s*=\\s*\\(.*?\\)\\s*=>\\s*\\{([\\s\\S]*?)\\};`);
        const funcMatch = content.match(funcDefRegex);
        
        if (funcMatch && funcMatch[1]) {
          const funcBody = funcMatch[1];
          
          // Check if function uses this setter
          if (funcBody.includes(setter)) {
            if (funcBody.includes(`${setter}(true)`) || 
                funcBody.includes(`${setter}(true);`)) {
              assignments.push(true);
            }
            else if (funcBody.includes(`${setter}(false)`) || 
                    funcBody.includes(`${setter}(false);`)) {
              assignments.push(false);
            }
            else if (funcBody.includes(`${setter}(prevMode =>`) || 
                    funcBody.includes(`${setter}(prev =>`) ||
                    funcBody.includes(`${setter}(!`) ||
                    funcBody.includes(`!prevMode`) ||
                    funcBody.includes(`!prev`)) {
              // Toggle pattern - include both possible values
              if (!assignments.includes(true)) assignments.push(true);
              if (!assignments.includes(false)) assignments.push(false);
            }
            else {
              // Function uses setter but we can't determine how, include both
              if (!assignments.includes(true)) assignments.push(true);
              if (!assignments.includes(false)) assignments.push(false);
            }
          }
        }
      }
      
      // Add transition if we found assignments
      if (assignments.length > 0) {
        transitions.push({
          name: stateVar,
          assignments
        });
      }
    }
    
    branchTransitions[branchIndex] = transitions;
  }
  
  return branchTransitions;
}

export function testComponentProperties(
  filePath: string, 
  properties: PBTAssertion[]
): ReactParseResult | { error: ValidationError[] } {
  try {
    // Parse the component to get state variables and other info
    const result = parseReactComponent(filePath, properties);
    
    // Validate that the assertions follow the required format
    const assertionValidation = validateAssertionFormat(properties);
    if (!assertionValidation.valid) {
      return { error: assertionValidation.errors };
    }
    
    // Validate that all variables in conditions are state variables
    const stateVarValidation = validateStateVariables(properties, result.state_variables);
    if (!stateVarValidation.valid) {
      // Add information about available state variables to the first error
      if (stateVarValidation.errors.length > 0 && stateVarValidation.errors[0].errorType === 'STATE_VARIABLE') {
        const availableStateVars = result.state_variables.join(', ');
        stateVarValidation.errors[0].message += `. Available state variables are: ${availableStateVars}`;
      }
      return { error: stateVarValidation.errors };
    }
    
    // Validate CNF format
    const cnfValidation = validateCNF(properties);
    if (!cnfValidation.valid) {
      return { error: cnfValidation.errors };
    }
    
    // Scan for transitions directly
    const branchTransitions = scanComponentTransitions(filePath);
    
    // Update each branch with its transitions
    let branchIndex = 0;
    result.branches.forEach(branch => {
      branchIndex++;
      if (branchTransitions[branchIndex] && branchTransitions[branchIndex].length > 0) {
        branch.transitions = branchTransitions[branchIndex];
      }
    });
    
    return result;
  } catch (err: any) {
    console.error("Error in testComponentProperties:", err);
    return { 
      error: [{
        message: `Error processing component: ${err.message || "Unknown error"}`,
        errorType: 'GENERAL'
      }]
    };
  }
}