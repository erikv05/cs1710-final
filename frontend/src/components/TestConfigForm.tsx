import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Card,
  CardContent,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormHelperText,
  Alert,
  Snackbar,
  CircularProgress,
  alpha,
  Divider,
  FormControlLabel,
  Switch
} from '@mui/material';
import { Add, Delete, PlayArrow, Info } from '@mui/icons-material';
import axios from 'axios';
import type { PropertyTestResult } from '../types/PropertyTestResult';
import type { Z3Response } from '../types/Z3Response';

interface Assertion {
  name: string;
  type: string;
  textToFind?: string;
  condition?: string;
  expected?: string;
}

interface TestConfigFormProps {
  setResults: (results: PropertyTestResult[] | null) => void;
}

interface Literal {
  name: string;
  assignment: boolean;
}

// Parse condition string into CNF format
function parseConditionToCNF(condition: string): Literal[][] {
  if (!condition.trim()) {
    // Default to "true" if condition is empty
    return [[{ name: 'default', assignment: true }]];
  }

  // Remove all spaces for easier parsing
  const cleanCondition = condition.replace(/\s+/g, '');
  
  // Helper function to process a single clause (may contain parentheses)
  function processClause(clause: string): Literal[] {
    // Find all parenthesized expressions
    let processedClause = clause;
    const parenRegex = /\(([^()]+)\)/g;
    let match;
    
    // Replace all parenthesized expressions with their processed results
    while ((match = parenRegex.exec(clause)) !== null) {
      const innerExpression = match[1];
      
      // Replace the entire parenthesized expression with the processed result
      processedClause = processedClause.replace(`(${innerExpression})`, innerExpression);
    }
    
    // At this point, we should have no parentheses, just AND terms
    const andTerms = processedClause.split('&');
    
    return andTerms.map(term => {
      term = term.trim();
      // Check if term is negated
      if (term.startsWith('!')) {
        return { name: term.substring(1), assignment: false };
      }
      return { name: term, assignment: true };
    });
  }
  
  // Split the expression by OR operators
  // First, let's handle any top-level parenthesized expressions
  let normalizedExpression = cleanCondition;
  
  // Replace all parenthesized expressions with a standardized format
  const parenthesizedExpressions: string[] = [];
  let nestedLevel = 0;
  let currentExpr = '';
  
  for (let i = 0; i < normalizedExpression.length; i++) {
    const char = normalizedExpression[i];
    
    if (char === '(') {
      nestedLevel++;
      if (nestedLevel === 1) {
        // Start of a top-level parenthesized expression
        currentExpr = '';
      } else {
        // Nested parenthesis, include it in current expression
        currentExpr += char;
      }
    } 
    else if (char === ')') {
      nestedLevel--;
      if (nestedLevel === 0) {
        // End of a top-level parenthesized expression
        parenthesizedExpressions.push(currentExpr);
        normalizedExpression = normalizedExpression.replace(
          `(${currentExpr})`, 
          `__EXPR${parenthesizedExpressions.length - 1}__`
        );
        // Adjust index to account for replacement
        i = i - currentExpr.length - 2 + `__EXPR${parenthesizedExpressions.length - 1}__`.length;
      } else {
        // Nested parenthesis, include it in current expression
        currentExpr += char;
      }
    }
    else if (nestedLevel > 0) {
      // Inside parentheses, add to current expression
      currentExpr += char;
    }
  }
  
  // Now we can safely split by OR operator without worrying about parentheses
  const orClauses = normalizedExpression.split('|');
  
  // For CNF format, OR operations within a clause should be represented
  // as a single clause containing multiple literals.
  // We need a single clause with all the literals joined by OR
  if (orClauses.length > 1) {
    // This is an OR expression, create a single clause with all literals
    const combinedClause: Literal[] = [];
    
    for (const orClause of orClauses) {
      // Replace any expression placeholders with their actual expressions
      let processedClause = orClause;
      const exprRegex = /__EXPR(\d+)__/g;
      let exprMatch;
      
      while ((exprMatch = exprRegex.exec(orClause)) !== null) {
        const exprIndex = parseInt(exprMatch[1]);
        const innerExpression = parenthesizedExpressions[exprIndex];
        processedClause = processedClause.replace(
          `__EXPR${exprIndex}__`, 
          innerExpression
        );
      }
      
      // Process each OR term and add to the combined clause
      const literals = processClause(processedClause);
      combinedClause.push(...literals);
    }
    
    // Return a single clause with all the OR literals
    return [combinedClause];
  } else {
    // This is not an OR expression, process normally
    // Replace any expression placeholders with their actual expressions
    let processedClause = orClauses[0];
    const exprRegex = /__EXPR(\d+)__/g;
    let exprMatch;
    
    while ((exprMatch = exprRegex.exec(orClauses[0])) !== null) {
      const exprIndex = parseInt(exprMatch[1]);
      const innerExpression = parenthesizedExpressions[exprIndex];
      processedClause = processedClause.replace(
        `__EXPR${exprIndex}__`, 
        innerExpression
      );
    }
    
    // For a normal AND expression, process into multiple clauses
    const clauses = processClause(processedClause);
    
    // For proper CNF, each literal in an AND expression becomes its own clause
    return clauses.map(literal => [literal]);
  }
}

// Parse expected string into CNF format
function parseExpectedToCNF(expected: string, assertionName: string): Literal[][] | { error: string } {
  if (!expected.trim()) {
    // Default to "true" if expected is empty
    return [[{ name: 'result', assignment: true }]];
  }

  const cleanExpected = expected.trim();
  
  // Validate that the expected value follows the required format: either "assertionName" or "!assertionName"
  if (cleanExpected !== assertionName && cleanExpected !== `!${assertionName}`) {
    return { 
      error: `Expected value must be either "${assertionName}" or "!${assertionName}"`
    };
  }

  let literal: Literal;

  // Check if the expected value is negated
  if (cleanExpected.startsWith('!')) {
    literal = { name: cleanExpected.substring(1), assignment: false };
  } else {
    literal = { name: cleanExpected, assignment: true };
  }

  // Wrap in CNF structure (double array)
  return [[literal]];
}

const TestConfigForm = ({ setResults }: TestConfigFormProps) => {
  const [filepath, setFilepath] = useState('');
  const [assertions, setAssertions] = useState<Assertion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [useStatefulTesting, setUseStatefulTesting] = useState(true);

  const handleAddAssertion = () => {
    setAssertions([
      ...assertions,
      {
        name: '',
        type: 'TextPBTAssertion',
        textToFind: '',
      },
    ]);
  };

  const handleRemoveAssertion = (index: number) => {
    const newAssertions = [...assertions];
    newAssertions.splice(index, 1);
    setAssertions(newAssertions);
  };

  const handleAssertionChange = (
    index: number,
    field: keyof Assertion,
    value: string
  ) => {
    const newAssertions = [...assertions];
    newAssertions[index] = {
      ...newAssertions[index],
      [field]: value,
    };
    setAssertions(newAssertions);
  };

  const handleSubmit = async () => {
    if (!filepath) {
      setError('Filepath is required');
      setShowError(true);
      return;
    }

    if (assertions.length === 0) {
      setError('At least one assertion is required');
      setShowError(true);
      return;
    }

    for (const assertion of assertions) {
      if (!assertion.name) {
        setError('All assertions must have a name');
        setShowError(true);
        return;
      }

      if (assertion.type === 'TextPBTAssertion' && !assertion.textToFind) {
        setError('All text assertions must have text to find');
        setShowError(true);
        return;
      }
      
      // Validate expected format
      if (assertion.expected) {
        const expectedResult = parseExpectedToCNF(assertion.expected, assertion.name);
        if ('error' in expectedResult) {
          setError(expectedResult.error);
          setShowError(true);
          return;
        }
      }
    }

    try {
      setLoading(true);
      // Parse each condition and expected fields to create the required CNF format
      const payload = {
        filepath,
        useStatefulTesting,
        textAssertions: assertions.map(assertion => {
          // Parse the condition string to CNF format
          const lhs = assertion.condition ? 
            parseConditionToCNF(assertion.condition) : 
            [[{ name: 'default', assignment: true }]];
          
          // Parse the expected string to CNF format
          const rhs = assertion.expected ? 
            parseExpectedToCNF(assertion.expected, assertion.name) as Literal[][] : 
            [[{ name: 'result', assignment: true }]];
          
          return {
            name: assertion.name,
            textToFind: assertion.textToFind,
            lhs,
            rhs
          };
        })
      };
      
      console.log("Sending payload to server:", JSON.stringify(payload, null, 2));
      
      const response = await axios.post('http://localhost:3000/', payload);
      console.log("Server response:", response.data);
      
      // Ensure data has the correct format
      if (response.data && response.data.results && Array.isArray(response.data.results)) {
        // Transform the data to match our PropertyTestResult interface
        const formattedResults = response.data.results.map((result: Z3Response | { error: string, errorType?: string, isStateVarError?: boolean }, index: number) => {
          const assertionInfo = {
            name: assertions[index].name,
            type: "TextPBTAssertion",
            textToFind: assertions[index].textToFind
          };

          if ('error' in result) {
            return {
              assertion: assertionInfo,
              success: false,
              errorMessage: result.error,
              errorType: result.errorType || 'GENERAL',
              isStateVarError: result.isStateVarError || false,
              z3Result: null
            };
          }

          return {
            assertion: assertionInfo,
            success: result.result === 'passed',
            errorMessage: result.result === 'failed' ? `Failed: ${result.violated_pbt}` : undefined,
            z3Result: result
          };
        });
        
        setResults(formattedResults);
      } else {
        // Set error state for invalid response format
        setError("Invalid response format from server");
        setShowError(true);
        console.error("Invalid response format:", response.data);
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        setError(`Server error: ${error.response.data}`);
      } else {
        setError('An unexpected error occurred');
      }
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper 
      sx={{ 
        p: 4, 
        mb: 3, 
        borderRadius: 2,
        boxShadow: theme => theme.palette.mode === 'dark' 
          ? '0 8px 32px rgba(0, 0, 0, 0.2)'
          : '0 8px 32px rgba(0, 0, 0, 0.05)'
      }}
      className="fade-in"
    >
      <Typography 
        variant="h5" 
        sx={{ 
          fontWeight: 600, 
          mb: 3,
          letterSpacing: '-0.025em' 
        }}
      >
        Custom Property-Based Tests
      </Typography>
      
      <Box 
        sx={{ 
          p: 2.5, 
          mb: 4, 
          borderRadius: 2,
          bgcolor: theme => alpha(theme.palette.info.main, 0.1),
          border: '1px solid',
          borderColor: theme => alpha(theme.palette.info.main, 0.2),
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1.5
        }}
      >
        <Info 
          sx={{ 
            mt: 0.5,
            color: 'info.main',
            opacity: 0.7
          }} 
          fontSize="small"
        />
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            lineHeight: 1.6,
            fontWeight: 400,
          }}
        >
          Create custom property-based tests for your React components. Enter your component's filepath and define assertions to check text elements based on component state.
        </Typography>
      </Box>
      
      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          label="Component Filepath"
          value={filepath}
          onChange={(e) => setFilepath(e.target.value)}
          margin="normal"
          variant="outlined"
          placeholder="/path/to/component.tsx"
          sx={{ mb: 1 }}
          InputProps={{
            sx: { fontFamily: 'monospace', fontSize: '0.9rem' }
          }}
        />
        <FormHelperText sx={{ mx: 1.5 }}>
          Enter the absolute path to the React component you want to test
        </FormHelperText>
      </Box>

      <FormControlLabel
        control={
          <Switch
            checked={useStatefulTesting}
            onChange={(e) => setUseStatefulTesting(e.target.checked)}
            color="primary"
          />
        }
        label="Use Stateful Testing"
        sx={{ mb: 3 }}
      />

      {assertions.length === 0 ? (
        <Box 
          sx={{ 
            mb: 3, 
            p: 4, 
            bgcolor: theme => theme.palette.mode === 'dark' 
              ? 'rgba(255, 255, 255, 0.03)' 
              : 'rgba(0, 0, 0, 0.02)', 
            borderRadius: 2,
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2
          }}
        >
          <Typography color="text.secondary" align="center" sx={{ mb: 1 }}>
            No assertions added yet. 
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<Add />}
            onClick={handleAddAssertion}
            size="medium"
            sx={{ 
              fontWeight: 500,
              px: 3,
              borderRadius: 6,
              borderWidth: '1.5px'
            }}
          >
            Add First Assertion
          </Button>
        </Box>
      ) : (
        <>
          <Typography 
            variant="subtitle1" 
            sx={{ 
              mb: 2, 
              fontWeight: 600,
              color: 'text.primary',
              opacity: 0.8
            }}
          >
            Test Assertions
          </Typography>
          
          {assertions.map((assertion, index) => (
            <Card 
              key={index} 
              variant="outlined" 
              sx={{ 
                mb: 3, 
                borderRadius: 2,
                borderColor: theme => theme.palette.mode === 'dark' 
                  ? alpha(theme.palette.primary.main, 0.2)
                  : alpha(theme.palette.primary.main, 0.2),
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                overflow: 'visible',
                transition: 'all 0.2s ease',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'flex-start' }}>
                  <Box sx={{ flexGrow: 1 }}>
                    <TextField
                      fullWidth
                      label="Assertion Name"
                      value={assertion.name}
                      onChange={(e) =>
                        handleAssertionChange(index, 'name', e.target.value)
                      }
                      variant="outlined"
                      placeholder="e.g., Has Loading Text"
                      sx={{ 
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1.5,
                        }
                      }}
                    />
                  </Box>
                  <Box>
                    <IconButton
                      color="error"
                      onClick={() => handleRemoveAssertion(index)}
                      sx={{ 
                        bgcolor: theme => alpha(theme.palette.error.main, 0.05),
                        '&:hover': {
                          bgcolor: theme => alpha(theme.palette.error.main, 0.1),
                        }
                      }}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel>Assertion Type</InputLabel>
                    <Select
                      value={assertion.type}
                      onChange={(e) =>
                        handleAssertionChange(index, 'type', e.target.value)
                      }
                      label="Assertion Type"
                      sx={{ 
                        borderRadius: 1.5,
                      }}
                    >
                      <MenuItem value="TextPBTAssertion">Text Assertion</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                {assertion.type === 'TextPBTAssertion' && (
                  <Box sx={{ mb: 3 }}>
                    <TextField
                      fullWidth
                      label="Text to Find"
                      value={assertion.textToFind || ''}
                      onChange={(e) =>
                        handleAssertionChange(index, 'textToFind', e.target.value)
                      }
                      variant="outlined"
                      placeholder="e.g., Loading..."
                      sx={{ 
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1.5,
                        }
                      }}
                    />
                  </Box>
                )}

                <Divider sx={{ my: 3, opacity: 0.6 }} />
                
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    mb: 2, 
                    color: 'text.secondary',
                    fontWeight: 600
                  }}
                >
                  Conditions
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <TextField
                    fullWidth
                    label="Condition (When)"
                    value={assertion.condition || ''}
                    onChange={(e) =>
                      handleAssertionChange(index, 'condition', e.target.value)
                    }
                    variant="outlined"
                    placeholder="isLoading && isDarkMode"
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                      },
                      mb: 1
                    }}
                  />
                  <FormHelperText sx={{ ml: 1.5 }}>
                    Enter a boolean expression that describes when this assertion should be checked
                  </FormHelperText>
                </Box>

                <Box sx={{ mb: 1 }}>
                  <TextField
                    fullWidth
                    label="Expected (Then)"
                    value={assertion.expected || ''}
                    onChange={(e) =>
                      handleAssertionChange(index, 'expected', e.target.value)
                    }
                    variant="outlined"
                    placeholder="hasLoadingText"
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                      },
                      mb: 1
                    }}
                  />
                  <FormHelperText sx={{ ml: 1.5 }}>
                    Enter what should be true when the condition is met
                  </FormHelperText>
                </Box>
              </CardContent>
            </Card>
          ))}
        </>
      )}

      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          mt: 4,
          pt: 3,
          borderTop: '1px solid',
          borderColor: theme => theme.palette.mode === 'dark' 
            ? 'rgba(255, 255, 255, 0.1)' 
            : 'rgba(0, 0, 0, 0.1)',
        }}
      >
        {assertions.length > 0 && (
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={handleAddAssertion}
            sx={{ 
              fontWeight: 500,
              borderRadius: 6,
              borderWidth: '1.5px'
            }}
          >
            Add Another Assertion
          </Button>
        )}

        <Button
          variant="contained"
          color="primary"
          startIcon={loading ? null : <PlayArrow />}
          onClick={handleSubmit}
          disabled={loading || assertions.length === 0 || !filepath}
          sx={{ 
            py: 1,
            px: 3,
            ml: 'auto',
            fontWeight: 500,
            borderRadius: 6,
            boxShadow: '0 3px 10px rgba(0, 0, 0, 0.1)',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 5px 15px rgba(0, 0, 0, 0.15)',
            },
            transition: 'all 0.2s ease'
          }}
        >
          {loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
              Running Tests...
            </Box>
          ) : 'Run Tests'}
        </Button>
      </Box>

      <Snackbar
        open={showError}
        autoHideDuration={6000}
        onClose={() => setShowError(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowError(false)} 
          severity="error"
          sx={{ 
            width: '100%',
            borderRadius: 2,
            fontSize: '0.9rem',
            fontWeight: 500,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
          }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default TestConfigForm; 