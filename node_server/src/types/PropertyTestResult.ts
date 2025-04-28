export interface PropertyTestResult {
  lhs: Record<string, boolean>; // State conditions
  rhs: Record<string, boolean>; // Properties satisfied
}
