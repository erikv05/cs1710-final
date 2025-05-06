import { useState } from 'react';
import { 
  ThemeProvider, 
  createTheme, 
  CssBaseline, 
  Box,
  Container,
  Paper,
  Tabs,
  Tab,
  Typography
} from '@mui/material';
import type { PropertyTestResult } from './types/PropertyTestResult';
import ExampleTest from './components/ExampleTest';
import TestConfigForm from './components/TestConfigForm';

// Placeholder components until we resolve the import issues
const AppHeader = ({ toggleTheme, isDarkMode }: { toggleTheme: () => void, isDarkMode: boolean }) => {
  return (
    <Box 
      sx={{ 
        p: 3,
        mb: 4, 
        bgcolor: 'transparent',
        color: 'text.primary',
        borderRadius: 2,
        backdropFilter: 'blur(8px)',
        boxShadow: theme => isDarkMode 
          ? '0 8px 32px rgba(0, 0, 0, 0.2)' 
          : '0 8px 32px rgba(0, 0, 0, 0.05)',
        transition: 'all 0.3s ease'
      }}
      className="fade-in"
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              fontWeight: 700, 
              letterSpacing: '-0.05em',
              background: theme => isDarkMode 
                ? 'linear-gradient(90deg, #90caf9 0%, #64b5f6 100%)' 
                : 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1
            }}
          >
            React PBT
          </Typography>
          <Typography 
            variant="subtitle1" 
            sx={{ 
              opacity: 0.8, 
              fontWeight: 400,
              letterSpacing: '0.01em'
            }}
          >
            Property-Based Testing for React Components
          </Typography>
        </Box>
        <Box 
          onClick={toggleTheme} 
          sx={{ 
            cursor: 'pointer',
            bgcolor: theme => isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
            p: 1.5,
            px: 2.5,
            borderRadius: 5,
            fontWeight: 500,
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            color: 'text.primary',
            '&:hover': {
              bgcolor: theme => isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              transform: 'translateY(-2px)'
            }
          }}
        >
          {isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        </Box>
      </Box>
    </Box>
  );
};

const TestResults = ({ results }: { results: PropertyTestResult[] }) => {
  if (!results || results.length === 0) {
    return (
      <Paper 
        sx={{ 
          p: 4, 
          borderRadius: 2, 
          boxShadow: theme => theme.palette.mode === 'dark' 
            ? '0 8px 32px rgba(0, 0, 0, 0.2)'
            : '0 8px 32px rgba(0, 0, 0, 0.05)'
        }}
        className="fade-in"
      >
        <Box sx={{ fontSize: '1.5rem', mb: 3, fontWeight: 600, letterSpacing: '-0.025em' }}>Test Results</Box>
        <Box sx={{ 
          p: 3, 
          textAlign: 'center', 
          color: 'text.secondary',
          bgcolor: 'background.paper',
          borderRadius: 1.5
        }}>
          No test results to display
        </Box>
      </Paper>
    );
  }

  return (
    <Paper 
      sx={{ 
        p: 4, 
        borderRadius: 2,
        boxShadow: theme => theme.palette.mode === 'dark' 
          ? '0 8px 32px rgba(0, 0, 0, 0.2)'
          : '0 8px 32px rgba(0, 0, 0, 0.05)'
      }}
      className="fade-in"
    >
      <Box sx={{ fontSize: '1.5rem', mb: 3, fontWeight: 600, letterSpacing: '-0.025em' }}>Test Results</Box>
      <Box>
        {results.map((result, i) => {
          // Ensure result and assertion are defined
          if (!result || !result.assertion) {
            return (
              <Box 
                key={i} 
                sx={{ 
                  p: 3, 
                  mb: 2, 
                  bgcolor: 'warning.light', 
                  borderRadius: 2,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                  transform: 'translateY(0)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.12)'
                  }
                }}
              >
                Invalid test result format
              </Box>
            );
          }
          
          return (
            <Box 
              key={i} 
              sx={{ 
                p: 3, 
                mb: 2, 
                bgcolor: result.success ? 'success.light' : 'error.light', 
                borderRadius: 2,
                color: result.success ? 'success.contrastText' : 'error.contrastText',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                transform: 'translateY(0)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 16px rgba(0, 0, 0, 0.12)'
                }
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 1
              }}>
                <Box sx={{ fontWeight: 600, fontSize: '1.1rem', letterSpacing: '-0.025em' }}>
                  {result.assertion.name || "Unnamed Test"}
                </Box>
                <Box sx={{ 
                  px: 2, 
                  py: 0.5, 
                  bgcolor: result.success ? 'success.dark' : 'error.dark',
                  borderRadius: 5,
                  fontSize: '0.85rem',
                  fontWeight: 500
                }}>
                  {result.success ? 'Success' : 'Failed'}
                </Box>
              </Box>
              
              {result.assertion.type === 'TextPBTAssertion' && result.assertion.textToFind && (
                <Box sx={{ fontSize: '0.95rem', opacity: 0.9, my: 1 }}>
                  Looking for text: <span style={{ fontFamily: 'monospace', padding: '0.15rem 0.3rem', background: 'rgba(0,0,0,0.1)', borderRadius: '3px' }}>"{result.assertion.textToFind}"</span>
                </Box>
              )}
              
              {!result.success && result.errorMessage && (
                <Box sx={{ 
                  mt: 2, 
                  p: 2, 
                  bgcolor: 'rgba(0,0,0,0.1)', 
                  borderRadius: 1.5,
                  fontSize: '0.9rem',
                  fontFamily: 'monospace'
                }}>
                  {result.errorMessage}
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
};

function App() {
  const [results, setResults] = useState<PropertyTestResult[] | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const theme = createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      primary: {
        main: isDarkMode ? '#90caf9' : '#1976d2',
      },
      secondary: {
        main: isDarkMode ? '#f48fb1' : '#f50057',
      },
      background: {
        default: isDarkMode ? '#121212' : '#f5f5f7',
        paper: isDarkMode ? '#1e1e1e' : '#ffffff',
      },
    },
    typography: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      h1: {
        fontWeight: 700,
        letterSpacing: '-0.025em',
      },
      h2: {
        fontWeight: 700,
        letterSpacing: '-0.025em',
      },
      h3: {
        fontWeight: 600,
        letterSpacing: '-0.025em',
      },
      h4: {
        fontWeight: 600,
        letterSpacing: '-0.025em',
      },
      h5: {
        fontWeight: 600,
        letterSpacing: '-0.025em',
      },
      h6: {
        fontWeight: 600,
        letterSpacing: '-0.025em',
      },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
            borderRadius: 8,
            padding: '8px 16px',
            boxShadow: 'none',
          },
          contained: {
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            '&:hover': {
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            boxShadow: isDarkMode 
              ? '0 8px 32px rgba(0, 0, 0, 0.2)'
              : '0 8px 32px rgba(0, 0, 0, 0.05)',
            transition: 'all 0.3s ease',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
            },
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          indicator: {
            height: 3,
            borderRadius: 3,
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
            fontSize: '0.975rem',
          },
        },
      },
    },
  });

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    // Clear results and errors when switching tabs
    setResults(null);
    setError(null);
  };

  // Fix the type incompatibility by using this typed wrapper
  const handleSetResults = (newResults: PropertyTestResult[] | null) => {
    if (!newResults) {
      setResults(null);
      return;
    }
    
    try {
      // Basic validation to ensure all results have required properties
      const validResults = newResults.filter(result => 
        result && result.assertion && typeof result.success === 'boolean'
      );
      
      if (validResults.length === 0) {
        setError("No valid test results received");
        setResults(null);
      } else {
        setResults(validResults);
        setError(null);
      }
    } catch (e) {
      console.error("Error processing test results:", e);
      setError("Error processing test results");
      setResults(null);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          background: theme => theme.palette.mode === 'dark' 
            ? 'linear-gradient(135deg, #121212 0%, #1e1e1e 100%)' 
            : 'linear-gradient(135deg, #f5f5f7 0%, #ffffff 100%)',
          transition: 'all 0.3s ease',
          pt: 2,
          pb: 6
        }}
      >
        <Container maxWidth="lg" sx={{ p: 2 }}>
          <AppHeader toggleTheme={toggleTheme} isDarkMode={isDarkMode} />
          
          <Paper 
            sx={{ 
              borderRadius: 2, 
              mb: 4, 
              overflow: 'hidden',
              boxShadow: theme => theme.palette.mode === 'dark' 
                ? '0 8px 32px rgba(0, 0, 0, 0.2)'
                : '0 8px 32px rgba(0, 0, 0, 0.05)',
            }}
          >
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              aria-label="test options"
              sx={{
                '& .MuiTabs-flexContainer': {
                  px: 2
                }
              }}
            >
              <Tab 
                label="Example Test" 
                sx={{ 
                  py: 2, 
                  '&.Mui-selected': { 
                    fontWeight: 600,
                  }
                }} 
              />
              <Tab 
                label="Custom Test" 
                sx={{ 
                  py: 2, 
                  '&.Mui-selected': { 
                    fontWeight: 600,
                  }
                }} 
              />
            </Tabs>
          </Paper>
          
          {tabValue === 0 && <ExampleTest setResults={handleSetResults} />}
          {tabValue === 1 && <TestConfigForm setResults={handleSetResults} />}
          
          {error && (
            <Paper 
              sx={{ 
                p: 3, 
                mb: 3, 
                bgcolor: 'error.light', 
                color: 'error.contrastText',
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
              }}
              className="fade-in"
            >
              <Typography variant="body1" sx={{ fontWeight: 500 }}>{error}</Typography>
            </Paper>
          )}
          
          {results && <TestResults results={results} />}
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
