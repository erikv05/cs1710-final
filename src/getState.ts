import { Project, SyntaxKind, Node, IfStatement } from "ts-morph";

interface Condition {
  stateVar: string;
  value: boolean;
}

interface PropertyTestResult {
  lhs: Record<string, boolean>; // State conditions
  rhs: Record<string, boolean>; // Properties satisfied
}

interface PropertyDefinition {
  name: string;        // User-defined property name
  textToFind: string;  // The actual text string to search for
}

export function parseReactComponent(
  filePath: string, 
  properties: PropertyDefinition[]
): PropertyTestResult[] {
  const project = new Project({ tsConfigFilePath: "tsconfig.json" });
  const sourceFile = project.addSourceFileAtPath(filePath);
  const results: PropertyTestResult[] = [];
  
  // Find all if statements in the component
  const ifStatements = sourceFile.getDescendantsOfKind(SyntaxKind.IfStatement);
  
  for (const ifStmt of ifStatements) {
    // Skip nested ifs
    if (ifStmt.getParent()?.getKind() === SyntaxKind.CaseClause) continue;
    
    // Process each if/else-if branch
    let currentIf: IfStatement | undefined = ifStmt;
    while (currentIf) {
      if (Node.isIfStatement(currentIf)) {
        // Get conditions from the if expression
        const conditions = extractConditions(currentIf.getExpression());
        
        // Get the content of the branch
        const content = currentIf.getThenStatement().getText();
        
        // Create state condition map (LHS)
        const lhs: Record<string, boolean> = {};
        for (const condition of conditions) {
          lhs[condition.stateVar] = condition.value;
        }
        
        // Evaluate properties (RHS)
        const rhs: Record<string, boolean> = {};
        for (const property of properties) {
          rhs[property.name] = content.includes(property.textToFind);
        }
        
        // Add to results
        results.push({ lhs, rhs });
        
        // Move to the next else-if or else
        const elseClause = currentIf.getElseStatement();
        if (elseClause && Node.isIfStatement(elseClause)) {
          currentIf = elseClause;
        } else if (elseClause) {
          // Handle final else
          const elseContent = elseClause.getText();
          const elseRhs: Record<string, boolean> = {};
          
          for (const property of properties) {
            elseRhs[property.name] = elseContent.includes(property.textToFind);
          }
          
          // For else, conditions would be the negation of previous conditions
          // For simplicity, we'll leave the LHS empty
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
  
  // Handle binary expressions (AND, OR operations)
  if (Node.isBinaryExpression(expression)) {
    const operator = expression.getOperatorToken().getText();
    
    if (operator === "&&") {
      // For AND, add conditions from both sides
      conditions.push(...extractConditions(expression.getLeft()));
      conditions.push(...extractConditions(expression.getRight()));
    }
  } 
  // Handle simple state variable checks (isLoading)
  else if (Node.isIdentifier(expression)) {
    conditions.push({
      stateVar: expression.getText(),
      value: true
    });
  }
  // Handle negations (!isDarkMode)
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
  properties: PropertyDefinition[]
): PropertyTestResult[] {
  return parseReactComponent(filePath, properties);
}