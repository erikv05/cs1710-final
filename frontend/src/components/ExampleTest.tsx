import { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button,
  Chip,
  CircularProgress,
  alpha
} from '@mui/material';
import type { PropertyTestResult } from '../types/PropertyTestResult';
import axios from 'axios';

interface ExampleTestProps {
  setResults: (results: PropertyTestResult[] | null) => void;
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

const ExampleTest = ({ setResults }: ExampleTestProps) => {
  const [filepath, setFilepath] = useState('/Users/erikvank/Desktop/cs1710-final/node_server/src/example/example_component.tsx');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runExampleTest = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('http://localhost:3000/', {
        filepath,
        textAssertions: [
          {
            name: 'Has Loading Text',
            textToFind: 'Loading...',
            lhs: [[{ name: 'isLoading', assignment: true }]],
            rhs: [[{ name: 'hasLoadingText', assignment: true }]]
          },
          {
            name: 'Has Dark Mode Button',
            textToFind: 'Switch to Light Mode',
            lhs: [
              [
                { name: 'isLoading', assignment: false },
                { name: 'isDarkMode', assignment: true }
              ]
            ],
            rhs: [[{ name: 'hasDarkModeButton', assignment: true }]]
          },
          {
            name: 'Has Light Mode Button',
            textToFind: 'Switch to Dark Mode',
            lhs: [
              [
                { name: 'isLoading', assignment: false },
                { name: 'isDarkMode', assignment: false }
              ]
            ],
            rhs: [[{ name: 'hasLightModeButton', assignment: true }]]
          }
        ]
      });

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
        console.error("Invalid response format:", response.data);
      }
    } catch (error) {
      console.error('Error running tests:', error);
      setError("Failed to run tests. Please check the server connection.");
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
        gutterBottom
        sx={{ 
          fontWeight: 600, 
          mb: 2,
          letterSpacing: '-0.025em'
        }}
      >
        Example Test
      </Typography>
      
      <Box 
        sx={{ 
          p: 2.5, 
          mb: 3, 
          borderRadius: 2,
          bgcolor: theme => alpha(theme.palette.primary.main, 0.1),
          border: '1px solid',
          borderColor: theme => alpha(theme.palette.primary.main, 0.2),
        }}
      >
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            lineHeight: 1.6,
            fontWeight: 400,
          }}
        >
          This example tests the example component for loading text and light/dark mode buttons.
          It validates that the correct UI elements appear based on component state.
        </Typography>
      </Box>

      <TextField
        fullWidth
        label="Component Filepath"
        value={filepath}
        onChange={(e) => setFilepath(e.target.value)}
        margin="normal"
        variant="outlined"
        sx={{ 
          mb: 3, 
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
          }
        }}
        InputProps={{
          sx: { fontFamily: 'monospace', fontSize: '0.9rem' }
        }}
      />

      <Typography 
        variant="subtitle2" 
        sx={{ 
          mb: 1.5, 
          fontWeight: 600,
          color: 'text.primary',
          opacity: 0.8
        }}
      >
        Test Assertions:
      </Typography>
      
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: 1.5, 
          mb: 3,
          p: 2.5,
          borderRadius: 2,
          bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
        }}
      >
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            p: 1.5,
            borderRadius: 2,
            bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
          }}
        >
          <Chip 
            label="isLoading" 
            color="primary"
            size="small"
            variant="outlined"
            sx={{ mr: 1, fontWeight: 500 }}
          />
          <Typography 
            variant="body2" 
            sx={{ mr: 1, opacity: 0.8, fontFamily: 'monospace' }}
          >
            →
          </Typography>
          <Chip 
            label="Loading..." 
            color="success"
            size="small"
            sx={{ fontWeight: 500 }}
          />
        </Box>
        
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            p: 1.5,
            borderRadius: 2,
            bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
          }}
        >
          <Chip 
            label="!isLoading & isDarkMode" 
            color="primary"
            size="small"
            variant="outlined"
            sx={{ mr: 1, fontWeight: 500 }}
          />
          <Typography 
            variant="body2" 
            sx={{ mr: 1, opacity: 0.8, fontFamily: 'monospace' }}
          >
            →
          </Typography>
          <Chip 
            label="Switch to Light Mode" 
            color="success"
            size="small"
            sx={{ fontWeight: 500 }}
          />
        </Box>
        
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            p: 1.5,
            borderRadius: 2,
            bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
          }}
        >
          <Chip 
            label="!isLoading & !isDarkMode" 
            color="primary"
            size="small"
            variant="outlined"
            sx={{ mr: 1, fontWeight: 500 }}
          />
          <Typography 
            variant="body2" 
            sx={{ mr: 1, opacity: 0.8, fontFamily: 'monospace' }}
          >
            →
          </Typography>
          <Chip 
            label="Switch to Dark Mode" 
            color="success"
            size="small"
            sx={{ fontWeight: 500 }}
          />
        </Box>
      </Box>

      {error && (
        <Box 
          sx={{ 
            mb: 3, 
            p: 2, 
            borderRadius: 2, 
            bgcolor: theme => alpha(theme.palette.error.main, 0.1),
            border: '1px solid',
            borderColor: theme => alpha(theme.palette.error.main, 0.2),
            color: 'error.main',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Typography sx={{ fontWeight: 500, fontSize: '0.9rem' }}>
            {error}
          </Typography>
        </Box>
      )}

      <Button 
        variant="contained" 
        color="primary"
        onClick={runExampleTest}
        disabled={loading || !filepath}
        fullWidth
        size="large"
        sx={{ 
          mt: 1, 
          py: 1.2,
          position: 'relative',
          overflow: 'hidden',
          fontWeight: 500,
          fontSize: '0.95rem',
          bgcolor: theme => theme.palette.primary.main,
          '&:hover': {
            bgcolor: theme => theme.palette.primary.dark,
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.2)',
          },
          transition: 'all 0.2s ease'
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
            Running Tests...
          </Box>
        ) : 'Run Example Test'}
      </Button>
    </Paper>
  );
};

export default ExampleTest; 