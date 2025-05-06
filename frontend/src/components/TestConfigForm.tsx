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
  Divider
} from '@mui/material';
import { Add, Delete, PlayArrow, Info } from '@mui/icons-material';
import axios from 'axios';
import type { PropertyTestResult } from '../types/PropertyTestResult';

interface Assertion {
  name: string;
  type: string;
  textToFind?: string;
  condition?: string;
  expected?: string;
}

interface ServerResult {
  assertion?: {
    name?: string;
    textToFind?: string;
  };
  name?: string;
  textToFind?: string;
  success?: boolean;
  errorMessage?: string;
}

interface TestConfigFormProps {
  setResults: (results: PropertyTestResult[] | null) => void;
}

const TestConfigForm = ({ setResults }: TestConfigFormProps) => {
  const [filepath, setFilepath] = useState('');
  const [assertions, setAssertions] = useState<Assertion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);
  const [loading, setLoading] = useState(false);

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
    }

    try {
      setLoading(true);
      // Parse each condition and expected fields to create the required CNF format
      const payload = {
        filepath,
        textAssertions: assertions.map(assertion => {
          const lhs = [[{ name: 'default', assignment: true }]];
          const rhs = [[{ name: 'result', assignment: true }]];
          
          // This is a simplified version for the demo
          // In a real implementation, we would parse the condition and expected strings
          // to create proper CNF structures
          
          return {
            name: assertion.name,
            textToFind: assertion.textToFind,
            lhs,
            rhs
          };
        })
      };
      
      const response = await axios.post('http://localhost:3000/', payload);
      console.log("Server response:", response.data);
      
      // Ensure data has the correct format
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        // Transform the data to match our PropertyTestResult interface
        const formattedResults = response.data.data.map((result: ServerResult) => {
          return {
            assertion: {
              name: result.assertion?.name || result.name || "Unnamed Test",
              type: "TextPBTAssertion",
              textToFind: result.assertion?.textToFind || result.textToFind
            },
            success: result.success !== undefined ? result.success : false,
            errorMessage: result.errorMessage
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