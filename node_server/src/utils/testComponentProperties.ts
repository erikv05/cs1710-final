import { Project, SyntaxKind, Node, IfStatement } from "ts-morph";
import { PBTAssertion, TextPBTAssertion } from "../types/PropertyDefinition";
import { PropertyTestResult } from "../types/PropertyTestResult";
import { Branch, PbtAssertion, Literal, Transition } from "../types/SolverRequest";

interface Condition {
  stateVar: string;
  value: boolean;
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

// Registry of handlers
const assertionHandlers: AssertionHandler[] = [
  new TextAssertionHandler(),
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

export function parseReactComponent(
  filePath: string, 
  properties: PBTAssertion[]
): PropertyTestResult[] {
  const project = new Project({ tsConfigFilePath: "tsconfig.json" });
  const sourceFile = project.addSourceFileAtPath(filePath);
  
  const ifStatements = sourceFile.getDescendantsOfKind(SyntaxKind.IfStatement);
  
  const uniqueStateVars = new Set<string>();
  const branches: Branch[] = [];
  
  // Extract property names for pbt_variables
  const pbtVariables = properties.map(prop => prop.name);
  
  // Scan entire file for useState hooks to build a mapping of setters to state variables
  const stateSetterMap = extractUseStateHooks(sourceFile);
  
  for (const ifStmt of ifStatements) {
    if (ifStmt.getParent()?.getKind() === SyntaxKind.CaseClause) continue;
    
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
        
        const content = currentIf.getThenStatement().getText();
        
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
            assignment: processAssertion(property, content)
          });
        }
        
        // Extract state transitions from the rendered component
        const transitions = extractStateTransitions(content, stateSetterMap);
        
        branches.push({
          conditions: conditionLiterals, 
          implications,
          transitions
        });
        
        const elseClause: any = currentIf.getElseStatement();
        if (elseClause && Node.isIfStatement(elseClause)) {
          currentIf = elseClause;
        } else if (elseClause) {
          const elseContent = elseClause.getText();
          
          const elseImplications: Literal[] = [];
          for (const property of properties) {
            elseImplications.push({
              name: property.name,
              assignment: processAssertion(property, elseContent)
            });
          }
          
          // Extract state transitions from the else clause
          const elseTransitions = extractStateTransitions(elseContent, stateSetterMap);
          
          branches.push({
            conditions: [], // Empty conditions for else branch
            implications: elseImplications,
            transitions: elseTransitions
          });
          currentIf = undefined;
        } else {
          currentIf = undefined;
        }
      } else {
        currentIf = undefined;
      }
    }
  }
  
  // Create PbtAssertions with proper structure
  const pbtAssertions: PbtAssertion[] = properties.map(p => ({
    name: p.name,
    cnf: p.rhs
  }));
  
  // Create a single result with all the information
  const result: PropertyTestResult = {
    state_variables: Array.from(uniqueStateVars),
    pbt_variables: pbtVariables,
    branches,
    preconditionals: properties[0].lhs, // TODO: change if we assume >1 PBT test per API req
    pbt_assertions: pbtAssertions
  };
  
  return [result];
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
            const stateVar = elements[0].getText();
            const stateSetter = elements[1].getText();
            stateSetterMap.set(stateSetter, stateVar);
          }
        }
      }
    }
  }
  
  return stateSetterMap;
}

// Extract state transitions from component content
function extractStateTransitions(content: string, stateSetterMap: Map<string, string>): Transition[] {
  const transitions: Transition[] = [];
  const transitionMap = new Map<string, boolean[]>();
  
  // For each setter function in our map
  for (const [setter, stateVar] of stateSetterMap.entries()) {
    // Simple pattern matching for setter calls like setSomething(true)
    const trueRegex = new RegExp(`${setter}\\(\\s*true\\s*\\)`, 'g');
    const falseRegex = new RegExp(`${setter}\\(\\s*false\\s*\\)`, 'g');
    
    // Initialize transition entry if it doesn't exist
    if (!transitionMap.has(stateVar)) {
      transitionMap.set(stateVar, []);
    }
    
    // Check for true assignments
    if (trueRegex.test(content) && !transitionMap.get(stateVar)?.includes(true)) {
      transitionMap.get(stateVar)?.push(true);
    }
    
    // Check for false assignments
    if (falseRegex.test(content) && !transitionMap.get(stateVar)?.includes(false)) {
      transitionMap.get(stateVar)?.push(false);
    }
    
    // Check for toggle pattern like setIsLoading(!isLoading)
    const toggleRegex = new RegExp(`${setter}\\(\\s*!\\s*${stateVar}\\s*\\)`, 'g');
    if (toggleRegex.test(content)) {
      // For toggles, we add both possibilities since this is a state transition analysis
      if (!transitionMap.get(stateVar)?.includes(true)) {
        transitionMap.get(stateVar)?.push(true);
      }
      if (!transitionMap.get(stateVar)?.includes(false)) {
        transitionMap.get(stateVar)?.push(false);
      }
    }
  }
  
  // Convert the map to Transition objects
  for (const [name, assignments] of transitionMap.entries()) {
    if (assignments.length > 0) {
      transitions.push({
        name,
        assignments
      });
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

// Keep the original function for backward compatibility
function extractConditions(expression: Node): Condition[] {
  const cnfConditions = extractConditionsInCNF(expression);
  // Flatten the CNF to a single array of conditions (for backward compatibility)
  return cnfConditions.flatMap(clause => clause);
}

export function testComponentProperties(
  filePath: string, 
  properties: PBTAssertion[]
): PropertyTestResult[] {
  return parseReactComponent(filePath, properties);
}