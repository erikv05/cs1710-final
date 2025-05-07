import type { Z3Response } from './Z3Response';

export interface TestAssertion {
  name: string;
  type: 'TextPBTAssertion' | 'LabelPBTAssertion';
  textToFind?: string;
  labelToFind?: string;
}

export interface PropertyTestResult {
  assertion: TestAssertion;
  success: boolean;
  errorMessage?: string;
  errorType?: 'STATE_VARIABLE' | 'ASSERTION_FORMAT' | 'CNF_FORMAT' | 'GENERAL';
  isStateVarError?: boolean;
  z3Result: Z3Response | null;
} 