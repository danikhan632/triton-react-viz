// CodeViewerComponent.jsx
import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { CodeiumEditor, Document, Language } from "@codeium/react-code-editor";

const CodeViewerComponent = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true); // Track loading state
  const [error, setError] = useState(null); // Track error state
  const [isInfoPopupOpen, setIsInfoPopupOpen] = useState(false);

  useEffect(() => {
    const fetchCode = async () => {
      try {
        const src = await fetchBlockSrc(); // Fetch the code asynchronously
        setCode(src); // Set the code when fetched successfully
        setLoading(false); // Set loading to false when done
      } catch (err) {
        console.error('Error fetching block source code:', err);
        setError('Failed to load code'); // Set error message
        setLoading(false); // Set loading to false in case of error
      }
    };

    fetchCode();
  }, []);

  const fetchBlockSrc = async () => {
    try {
      const response = await fetch('http://73.106.153.51:5002/get_src', {
        method: 'GET',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text(); // Wait for the text response
      console.log(text);
      return text;
    } catch (error) {
      console.error('Error fetching block source code:', error);
      throw error;
    }
  };

  // If there's an error, display an error message
  if (error) {
    return (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          bgcolor: 'red.800',
          p: 2,
          borderRadius: 1,
        }}
      >
        <Typography variant="h6" color="white">
          Error: {error}
        </Typography>
      </Box>
    );
  }

  // If the content is still loading, display a loading message
  if (loading) {
    return (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          bgcolor: 'grey.800',
          p: 2,
          borderRadius: 1,
        }}
      >
        <Typography variant="h6" color="grey.500">
          Loading...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%', // Fill parent container's height
        position: 'relative', // To position the Info Button absolutely
      }}
    >
      {/* Header Section - 35% Height */}
      <Box
        sx={{
          flex: '0 0 15%', // Occupies 35% of the vertical space
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 2, // Adds margin below the header
        }}
      >
        <Typography variant="h6" gutterBottom>
          Source Code Viewer
        </Typography>
      </Box>

      {/* Editor Section - 65% Height */}
      <Box
        sx={{
          flex: '1 1 85%', // Occupies remaining 65% of the vertical space
          overflow: 'auto',
        }}
      >
        <CodeiumEditor
          language="python" // Adjust based on your code's language
          theme="vs-dark"
          value={code} // Provide the fetched code as the initial content.
          options={{
            readOnly: true, // Makes the editor read-only for viewing purposes.
          }}
          style={{ height: '100%', width: '100%' }} // Ensure it fills the parent Box
          height={'100%'}
        />
      </Box>

      {/* Info Button */}
      <Button
        onClick={() => setIsInfoPopupOpen(true)}
        variant="outlined"
        sx={{ position: 'absolute', bottom: 10, right: 10 }}
      >
        Info
      </Button>

      {/* Info Dialog */}
      <Dialog open={isInfoPopupOpen} onClose={() => setIsInfoPopupOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Kernel Source Code</DialogTitle>
        <DialogContent>
          <Typography component="pre" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {code || 'No kernel source code available'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsInfoPopupOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CodeViewerComponent;
