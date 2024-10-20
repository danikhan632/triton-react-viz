// File: CodeViewerComponent.jsx
import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';

const CodeViewerComponent = ({ currBlock }) => {
  const [codeLines, setCodeLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInfoPopupOpen, setIsInfoPopupOpen] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [linesToHighlight, setLinesToHighlight] = useState([]);
  const codeContainerRef = useRef(null);

  useEffect(() => {
    if (!currBlock) {
      setCodeLines([]);
      setLinesToHighlight([]);
      setCurrentIndex(0);
      setLoading(false);
      return;
    }

    setCurrentIndex(0);
    setLoading(true);

    const fetchCode = async () => {
      try {
        const src = await fetchBlockSrc(); // Fetch the code asynchronously
        const codeArray = src.split('\n');
        setCodeLines(codeArray); // Set the code lines when fetched successfully

        // Extract lines to highlight from currBlock
        if (currBlock.processedData && currBlock.processedData.results) {
          const fetchedResults = currBlock.processedData.results;

          const lines = fetchedResults.map(result => {
            const lineNum = findLineNumber(codeArray, result.source_line);
            return lineNum;
          }).filter(lineNum => lineNum !== -1);

          setLinesToHighlight(lines);
        } else {
          setLinesToHighlight([]);
        }

        // Debugging logs
        console.log('currBlock:', currBlock);
        console.log('linesToHighlight:', linesToHighlight);
        console.log('linesToHighlight.length:', linesToHighlight.length);
        console.log('currentIndex:', currentIndex);

        setLoading(false); // Set loading to false when done
      } catch (err) {
        console.error('Error fetching block source code:', err);
        setError('Failed to load code'); // Set error message
        setLoading(false); // Set loading to false in case of error
      }
    };

    fetchCode();
  }, [currBlock]);

  useEffect(() => {
    highlightLine();
  }, [currentIndex, linesToHighlight]);

  // Key event listener to handle arrow key navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'ArrowRight') {
        stepForward();
      } else if (event.key === 'ArrowLeft') {
        stepBackward();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Clean up event listener on component unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentIndex, linesToHighlight]);

  const fetchBlockSrc = async () => {
    try {
      const response = await fetch('http://73.106.153.51:5002/get_src', {
        method: 'GET',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text(); // Wait for the text response
      return text;
    } catch (error) {
      console.error('Error fetching block source code:', error);
      throw error;
    }
  };

  const findLineNumber = (codeArray, sourceLine) => {
    for (let i = 0; i < codeArray.length; i++) {
      if (codeArray[i].trim() === sourceLine.trim()) {
        return i + 1; // Line numbers start at 1
      }
    }
    return -1; // Not found
  };

  const highlightLine = () => {
    if (codeContainerRef.current && linesToHighlight.length > 0) {
      const lineNumber = linesToHighlight[currentIndex];
      // Scroll to the line
      const lineElement = document.getElementById(`code-line-${lineNumber}`);
      if (lineElement) {
        lineElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const stepForward = () => {
    if (currentIndex < linesToHighlight.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const stepBackward = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
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

  if (!currBlock) {
    return (
      <Typography variant="h6" color="grey.500" align="center" sx={{ mt: 2 }}>
        Select a block to view code
      </Typography>
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
      {/* Header Section */}
      <Box
        sx={{
          flex: '0 0 15%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 2,
        }}
      >
        <Typography variant="h6" gutterBottom>
          Source Code Viewer
        </Typography>
      </Box>

      {/* Code Display Section */}
      <Box
        ref={codeContainerRef}
        sx={{
          flex: '1 1 85%',
          overflow: 'auto',
          bgcolor: '#1e1e1e',
          color: '#d4d4d4',
          p: 2,
          fontFamily: 'monospace',
          whiteSpace: 'pre-wrap',
          fontSize: '14px',
          lineHeight: '1.5',
        }}
      >
        {codeLines.map((line, index) => {
          const lineNumber = index + 1;
          const isHighlighted =
            linesToHighlight.length > 0 &&
            linesToHighlight[currentIndex] === lineNumber;
          return (
            <div
              key={index}
              id={`code-line-${lineNumber}`}
              style={{
                backgroundColor: isHighlighted ? 'rgba(255, 255, 0, 0.5)' : 'transparent',
                padding: '0 5px',
              }}
            >
              <span style={{ color: '#888', userSelect: 'none' }}>
                {lineNumber.toString().padStart(3, ' ')}:
              </span>{' '}
              {line}
            </div>
          );
        })}
      </Box>

      {/* Navigation Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <Button onClick={stepBackward} disabled={currentIndex === 0} sx={{ mr: 1 }}>
          Previous
        </Button>
        <Button
          onClick={stepForward}
          disabled={currentIndex >= linesToHighlight.length - 1}
          sx={{ ml: 1 }}
        >
          Next
        </Button>
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
      <Dialog
        open={isInfoPopupOpen}
        onClose={() => setIsInfoPopupOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Kernel Source Code</DialogTitle>
        <DialogContent>
          <Typography
            component="pre"
            sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
          >
            {codeLines.join('\n') || 'No kernel source code available'}
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
