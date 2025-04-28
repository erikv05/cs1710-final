import { Project, SyntaxKind, Node, IfStatement } from "ts-morph";
import { TextPropertyDefinition } from "../types/PropertyDefinition";
import { PropertyTestResult } from "../types/PropertyTestResult";

interface Condition {
  stateVar: string;
  value: boolean;
}


export function parseReactComponent(
  filePath: string, 
  properties: TextPropertyDefinition[]
): PropertyTestResult[] {
  const project = new Project({ tsConfigFilePath: "tsconfig.json" });
  const sourceFile = project.addSourceFileAtPath(filePath);
  const results: PropertyTestResult[] = [];
  
  const ifStatements = sourceFile.getDescendantsOfKind(SyntaxKind.IfStatement);
  
  for (const ifStmt of ifStatements) {
    if (ifStmt.getParent()?.getKind() === SyntaxKind.CaseClause) continue;
    
    let currentIf: IfStatement | undefined = ifStmt;
    while (currentIf) {
      if (Node.isIfStatement(currentIf)) {
        const conditions = extractConditions(currentIf.getExpression());
        
        const content = currentIf.getThenStatement().getText();
        
        const lhs: Record<string, boolean> = {};
        for (const condition of conditions) {
          lhs[condition.stateVar] = condition.value;
        }
        
        const rhs: Record<string, boolean> = {};
        for (const property of properties) {
          rhs[property.name] = content.includes(property.textToFind);
        }
        
        results.push({ lhs, rhs });
        
        const elseClause: any = currentIf.getElseStatement();
        if (elseClause && Node.isIfStatement(elseClause)) {
          currentIf = elseClause;
        } else if (elseClause) {
          const elseContent = elseClause.getText();
          const elseRhs: Record<string, boolean> = {};
          
          for (const property of properties) {
            elseRhs[property.name] = elseContent.includes(property.textToFind);
          }
          
          results.push({ lhs: {}, rhs: elseRhs });
          currentIf = undefined;
        } else {
          currentIf = undefined;
        }
      } else {
        currentIf = undefined;
      }
    }
  }
  
  return results;
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
  properties: TextPropertyDefinition[]
): PropertyTestResult[] {
  return parseReactComponent(filePath, properties);
}