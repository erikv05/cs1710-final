import type { Z3Response } from './Z3Response';

export interface PropertyTestResult {
  assertion: {
    name: string;
    type: string;
    textToFind?: string;
    // Additional properties can be added as needed
  };
  success: boolean;
  errorMessage?: string;
  errorType?: 'STATE_VARIABLE' | 'ASSERTION_FORMAT' | 'CNF_FORMAT' | 'GENERAL';
  isStateVarError?: boolean;
  z3Result?: Z3Response | null;
} 