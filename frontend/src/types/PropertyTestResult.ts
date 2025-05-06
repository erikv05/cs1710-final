export interface PropertyTestResult {
  assertion: {
    name: string;
    type: string;
    textToFind?: string;
    // Additional properties can be added as needed
  };
  success: boolean;
  errorMessage?: string;
} 