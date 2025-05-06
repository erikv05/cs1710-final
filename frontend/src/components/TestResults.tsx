import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  Divider,
  Chip,
} from '@mui/material';
import { CheckCircle, Cancel } from '@mui/icons-material';
import type { PropertyTestResult } from '../types/PropertyTestResult';

interface TestResultsProps {
  results: PropertyTestResult[];
}

const TestResults = ({ results }: TestResultsProps) => {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Test Results
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {results.length} assertion(s) tested
      </Typography>

      <List>
        {results.map((result, index) => (
          <Box key={index}>
            {index > 0 && <Divider sx={{ my: 2 }} />}
            <ListItem sx={{ px: 0, py: 2, display: 'block' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box>
                  {result.success ? (
                    <CheckCircle color="success" />
                  ) : (
                    <Cancel color="error" />
                  )}
                </Box>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6">{result.assertion.name}</Typography>
                  {result.assertion.type === 'TextPBTAssertion' && (
                    <Typography variant="body2" color="text.secondary">
                      Looking for text: "{result.assertion.textToFind}"
                    </Typography>
                  )}
                </Box>
                <Box>
                  <Chip
                    label={result.success ? 'Success' : 'Failed'}
                    color={result.success ? 'success' : 'error'}
                  />
                </Box>
              </Box>

              {!result.success && result.errorMessage && (
                <Box sx={{ mt: 1, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
                  <Typography variant="body2" color="error.contrastText">
                    {result.errorMessage}
                  </Typography>
                </Box>
              )}
            </ListItem>
          </Box>
        ))}
      </List>
    </Paper>
  );
};

export default TestResults; 