// src/components/CodeViewerComponent.jsx
import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

const CodeViewerComponent = ({
  currBlock,
  currLine,
  setCurrLine,
  codeLines,
  loadingCode,
  errorCode,
  processedData, // We now receive processedData
}) => {
  const codeContainerRef = useRef(null);
  const [linesToHighlight, setLinesToHighlight] = useState([]);

  // Refs to store the latest state for event handlers
  const latestCurrLineRef = useRef(currLine);
  const latestLinesToHighlightRef = useRef(linesToHighlight);

  // Update refs whenever currLine or linesToHighlight changes
  useEffect(() => {
    latestCurrLineRef.current = currLine;
    latestLinesToHighlightRef.current = linesToHighlight;
  }, [currLine, linesToHighlight]);

  // Function to find the line number of a specific source line
  const findLineNumber = (lines, sourceLine) => {
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === sourceLine.trim()) {
        return i + 1; // Line numbers start at 1
      }
    }
    return -1; // Not found
  };

  // Determine which lines to highlight based on processedData
  useEffect(() => {
    if (!processedData || !processedData.results || !codeLines) {
      setLinesToHighlight([]);
      return;
    }

    // Extract unique line numbers based on control flow from results
    const highlightSet = new Set();
    processedData.results.forEach((result) => {
      const lineNum = findLineNumber(codeLines, result.source_line);
      if (lineNum !== -1) {
        highlightSet.add(lineNum);
      }
    });

    // Convert Set to Array and sort based on the order in results
    const highlightLines = processedData.results
      .map((result) => {
        const lineNum = findLineNumber(codeLines, result.source_line);
        return lineNum;
      })
      .filter((lineNum) => lineNum !== -1);

    setLinesToHighlight(highlightLines);
  }, [processedData, codeLines]);

  // Automatically set currLine to the first highlighted line or default to first line
  useEffect(() => {
    if (linesToHighlight.length > 0) {
      setCurrLine(linesToHighlight[0]);
    } else if (codeLines.length > 0) {
      setCurrLine(1); // Default to first line if no highlights
    }
  }, [linesToHighlight, codeLines, setCurrLine]);

  // Scroll to the current line when currLine changes
  useEffect(() => {
    if (currLine && codeContainerRef.current) {
      const lineElement = document.getElementById(`code-line-${currLine}`);
      if (lineElement) {
        lineElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currLine]);

  // Handle keyboard navigation using up and down arrow keys
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        handleNextLine();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        handlePrevLine();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handlePrevLine = () => {
    const { current: currentLine } = latestCurrLineRef;
    const { current: currentHighlights } = latestLinesToHighlightRef;

    if (currentLine) {
      const currentIndex = currentHighlights.indexOf(currentLine);
      if (currentIndex > 0) {
        const newLine = currentHighlights[currentIndex - 1];
        setCurrLine(newLine);
      }
    }
  };

  const handleNextLine = () => {
    const { current: currentLine } = latestCurrLineRef;
    const { current: currentHighlights } = latestLinesToHighlightRef;

    if (currentLine) {
      const currentIndex = currentHighlights.indexOf(currentLine);
      if (currentIndex < currentHighlights.length - 1) {
        const newLine = currentHighlights[currentIndex + 1];
        setCurrLine(newLine);
      }
    }
  };

  // Info Dialog state
  const [isInfoPopupOpen, setIsInfoPopupOpen] = useState(false);

  // If there's an error fetching code, display it
  if (errorCode) {
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
          Error: {errorCode}
        </Typography>
      </Box>
    );
  }

  // If the code is still loading, display a loading message
  if (loadingCode) {
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

  // If no block is selected, display a message
  if (!currBlock) {
    return (
      <Typography
        variant="h6"
        color="grey.500"
        align="center"
        sx={{ mt: 2 }}
      >
        Select a block to view code
      </Typography>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
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
          const isCurrent = currLine === lineNumber;

          return (
            <div
              key={index}
              id={`code-line-${lineNumber}`}
              style={{
                backgroundColor: isCurrent
                  ? 'rgba(255, 255, 0, 0.7)' // Highlighted color
                  : 'transparent',
                padding: '0 5px',
                cursor: 'default',
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
      {linesToHighlight.length > 1 && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mt: 2,
            gap: 2,
          }}
        >
          <Button
            onClick={handlePrevLine}
            disabled={currLine === linesToHighlight[0]}
            variant="contained"
          >
            Previous
          </Button>
          <Button
            onClick={handleNextLine}
            disabled={
              currLine === linesToHighlight[linesToHighlight.length - 1]
            }
            variant="contained"
          >
            Next
          </Button>
        </Box>
      )}

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
