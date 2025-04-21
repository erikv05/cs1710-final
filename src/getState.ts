import { Project, SyntaxKind, Node, BindingElement } from "ts-morph";

function getStateVariables(filePath: string): string[] {
  const project = new Project({ tsConfigFilePath: "tsconfig.json" });
  const source = project.addSourceFileAtPath(filePath);
  const stateVars: string[] = [];

  source.getDescendantsOfKind(SyntaxKind.VariableDeclaration).forEach(decl => {
    const callExpr = decl.getInitializer()?.asKind(SyntaxKind.CallExpression);
    if (!callExpr) return;
    const expr = callExpr.getExpression();
    if (!Node.isIdentifier(expr) || expr.getText() !== "useState") return;

    const nameNode = decl.getNameNode();
    if (Node.isArrayBindingPattern(nameNode)) {
      nameNode.getElements().forEach(elem => {
        if (!Node.isBindingElement(elem)) return;
        stateVars.push(elem.getNameNode().getText());
      });
    }
  });

  return stateVars;
}

// hardcoded path
const filePath = "/Users/erikvank/Desktop/blackout-web/src/App.tsx";
console.log(getStateVariables(filePath));