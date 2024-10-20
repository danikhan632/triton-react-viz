// App.jsx
import React, { useState } from 'react'; // Import useState
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
  const [currBlock, setCurrBlock] = useState(null); // Add currBlock state

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
          {/* Grid View - Left Side (60%) */}
          <Box
            sx={{
              flex: '0 0 60%', // Increased to 60% width
              p: 2,
              overflow: 'auto',
              height: '100%', // Ensure it fills parent height
            }}
          >
            <GridViewComponent setCurrBlock={setCurrBlock} /> {/* Pass setCurrBlock */}
          </Box>

          {/* Code Viewer - Right Side (40%) */}
          <Box
            sx={{
              flex: '0 0 40%', // Reduced to 40% width
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              bgcolor: 'grey.800',
              height: '100%', // Fill parent height
              overflow: 'auto', // Allow scrolling if necessary
            }}
          >
            <CodeViewerComponent currBlock={currBlock} /> {/* Pass currBlock */}
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default App;
