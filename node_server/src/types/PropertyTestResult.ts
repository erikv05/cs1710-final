import { Branch } from "./SolverRequest";
import { Literal } from "./PropertyDefinition";
import { PbtAssertion } from "./SolverRequest";

export interface PropertyTestResult {
  state_variables: string[];
  pbt_variables: string[];
  branches: Branch[];
  preconditionals: Literal[];
  pbt_assertions: PbtAssertion[];
}
