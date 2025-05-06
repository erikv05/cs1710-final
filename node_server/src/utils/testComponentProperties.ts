import { Project, SyntaxKind, Node, IfStatement } from "ts-morph";
import { PBTAssertion, TextPBTAssertion } from "../types/PropertyDefinition";
import { PropertyTestResult } from "../types/PropertyTestResult";
import { Branch, PbtAssertion, Literal } from "../types/SolverRequest";

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
  
  for (const ifStmt of ifStatements) {
    if (ifStmt.getParent()?.getKind() === SyntaxKind.CaseClause) continue;
    
    let currentIf: IfStatement | undefined = ifStmt;
    while (currentIf) {
      if (Node.isIfStatement(currentIf)) {
        const conditions = extractConditions(currentIf.getExpression());
        
        for (const condition of conditions) {
          uniqueStateVars.add(condition.stateVar);
        }
        
        const content = currentIf.getThenStatement().getText();
        
        // Convert conditions to Literal[] for the Branch
        const conditionLiterals: Literal[] = conditions.map(cond => ({
          name: cond.stateVar,
          assignment: cond.value
        }));
        
        // Process each property with appropriate handler
        const implications: Literal[] = [];
        for (const property of properties) {
          implications.push({
            name: property.name,
            assignment: processAssertion(property, content)
          });
        }
        
        branches.push({
          conditions: [conditionLiterals], 
          implications,
          transitions: []
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
          
          branches.push({
            conditions: [], // Empty conditions for else branch
            implications: elseImplications,
            transitions: []
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
    cnf: [] // Empty CNF for now
  }));
  
  // Create a single result with all the information
  const result: PropertyTestResult = {
    state_variables: Array.from(uniqueStateVars),
    pbt_variables: pbtVariables,
    branches,
    preconditionals: [],
    pbt_assertions: pbtAssertions
  };
  
  return [result];
}

function extractConditions(expression: Node): Condition[] {
  const conditions: Condition[] = [];
  
  if (Node.isBinaryExpression(expression)) {
    const operator = expression.getOperatorToken().getText();
    
    if (operator === "&&") {
      conditions.push(...extractConditions(expression.getLeft()));
      conditions.push(...extractConditions(expression.getRight()));
    }
  } 
  else if (Node.isIdentifier(expression)) {
    conditions.push({
      stateVar: expression.getText(),
      value: true
    });
  }
  else if (Node.isPrefixUnaryExpression(expression) && 
           expression.getOperatorToken() === SyntaxKind.ExclamationToken) {
    const operand = expression.getOperand();
    if (Node.isIdentifier(operand)) {
      conditions.push({
        stateVar: operand.getText(),
        value: false
      });
    }
  }
  
  return conditions;
}

export function testComponentProperties(
  filePath: string, 
  properties: PBTAssertion[]
): PropertyTestResult[] {
  return parseReactComponent(filePath, properties);
}