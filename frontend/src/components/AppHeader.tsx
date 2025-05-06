import { AppBar, Toolbar, Typography, IconButton, Box } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';

interface AppHeaderProps {
  toggleTheme: () => void;
  isDarkMode: boolean;
}

const AppHeader = ({ toggleTheme, isDarkMode }: AppHeaderProps) => {
  return (
    <AppBar position="static" sx={{ mb: 3, borderRadius: 1 }}>
      <Toolbar>
        <Typography variant="h5" component="div" sx={{ flexGrow: 1 }}>
          React Property-Based Testing
        </Typography>
        <Box>
          <IconButton color="inherit" onClick={toggleTheme}>
            {isDarkMode ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default AppHeader; 