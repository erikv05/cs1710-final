export interface Literal {
  name: string;
  assignment: boolean;
}

export interface Transition {
  name: string;
  assignments: boolean[];
}

export interface Branch {
  conditions: Literal[][];  // CNF criteria for being in this branch
  implications: Literal[];  // Resulting rendered state
  transitions: Transition[];   // State variable transitions
}

export interface PBTOutAssertion {
  name: string;
  cnf: Literal[][];
}

export interface AssertionSet {
  preconditionals: Literal[][];
  pbt_assertions: PBTOutAssertion;
}

export interface SolverRequest {
  state_variables: string[];
  pbt_variables: string[];
  branches: Branch[];
  preconditionals: Literal[][];
  pbt_assertions: PBTOutAssertion;
} 

export interface ParseResult {
  state_variables: string[];
  pbt_variables: string[];
  branches: Branch[];
  assertions: AssertionSet[];
}