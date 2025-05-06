export interface Literal {
  name: string;
  assignment: boolean;
}

export interface Branch {
  conditions: Literal[][];  // CNF criteria for being in this branch
  implications: Literal[];  // Resulting rendered state
  transitions: Literal[];   // State variable transitions
}

export interface PbtAssertion {
  name: string;
  cnf: Literal[][];
}

export interface SolverRequest {
  state_variables: string[];
  pbt_variables: string[];
  branches: Branch[];
  preconditionals: Literal[];
  pbt_assertions: PbtAssertion[];
} 