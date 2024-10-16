// App.jsx
import React from 'react';
import { Box, Typography } from '@mui/material';
import GridViewComponent from './components/GridViewComponent';
import CodeViewerComponent from './components/CodeViewerComponent';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

const App = () => {
  return (
    <ThemeProvider theme={darkTheme}>
      {/* Root Container */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh', // Full viewport height
          bgcolor: 'grey.900',
          color: 'white',
        }}
      >
        {/* Header */}
        <Box sx={{ bgcolor: 'grey.800', p: 2 }}>
          <Typography variant="h4" align="center">
            GPU Profiling Tool
          </Typography>
        </Box>

        {/* Main Content */}
        <Box
          sx={{
            display: 'flex',
            flexGrow: 1, // Fill remaining space after header
            minHeight: 0, // Critical for allowing children to shrink
          }}
        >
          {/* Grid View - Left Side (40%) */}
          <Box
            sx={{
              flex: '0 0 60%', // Increased to 40% width
              p: 2,
              overflow: 'auto',
              height: '100%', // Ensure it fills parent height
            }}
          >
            <GridViewComponent />
          </Box>

          {/* Code Viewer - Right Side */}
          <Box
            sx={{
              flex: '0 0 40%', // Reduced to 60% width
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              bgcolor: 'grey.800',
              height: '100%', // Fill parent height
              overflow: 'auto', // Allow scrolling if necessary
            }}
          >

              <CodeViewerComponent />
  
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default App;
