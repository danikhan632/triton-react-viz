// src/components/BlockView.jsx
import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';

const fetchAndLogBlockData = async (gridX, gridY, gridZ) => {
  console.log('Fetching data for block:', gridX, gridY, gridZ);

  try {
    const response = await fetch('http://73.106.153.51:5002/process_blocks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        x: gridX,
        y: gridY,
        z: gridZ,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching block data:', error);
    throw error;
  }
};

const BlockView = ({
  currBlock,
  setCurrBlock,
  currLine,
  codeLines,
  setProcessedData,
  processedData, // Received as a prop
}) => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [variables, setVariables] = useState({});

  useEffect(() => {
    if (!currBlock) {
      setVariables({});
      setProcessedData(null); // Clear processedData when no block is selected
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchAndLogBlockData(
          currBlock.x,
          currBlock.y,
          currBlock.z
        );
        setProcessedData(data); // Pass the fetched data back to App.jsx
        updateVariables(data);
      } catch (err) {
        setError('Failed to fetch block data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currBlock, setProcessedData]);

  useEffect(() => {
    if (processedData) {
      updateVariables(processedData);
    }
  }, [currLine, processedData]);

  const updateVariables = (data) => {
    if (data && data.results) {
      const newVariables = {};
      data.results.forEach((result) => {
        const resultLine = findLineNumber(result.source_line);
        if (resultLine <= currLine) {
          if (result.changed_vars) {
            Object.entries(result.changed_vars).forEach(([key, value]) => {
              newVariables[key] =
                typeof value === 'object' ? value.data : value;
            });
          }
        }
      });
      setVariables(newVariables);
    }
  };

  const handleBackClick = () => {
    setCurrBlock(null);
    setProcessedData(null); // Clear processedData when going back
  };

  const findLineNumber = (sourceLine) => {
    for (let i = 0; i < codeLines.length; i++) {
      if (codeLines[i].trim() === sourceLine.trim()) {
        return i + 1;
      }
    }
    return -1;
  };

  return (
    <Box>
      <Button onClick={handleBackClick} variant="contained" sx={{ mb: 2 }}>
        Back
      </Button>
      <Typography variant="h6">
        Block View for Block{' '}
        {currBlock
          ? `${currBlock.x},${currBlock.y},${currBlock.z}`
          : ''}
      </Typography>

      {/* Variables Display */}
      <Box
        sx={{
          mt: 2,
          mb: 2,
          p: 2,
          border: '1px solid #ccc',
          borderRadius: 2,
        }}
      >
        <Typography variant="h6">Variables (Line {currLine}):</Typography>
        {Object.entries(variables).length > 0 ? (
          Object.entries(variables).map(([key, value]) => (
            <Typography key={key} variant="body2">
              {key}: {JSON.stringify(value)}
            </Typography>
          ))
        ) : (
          <Typography variant="body2">
            No variables defined yet.
          </Typography>
        )}
      </Box>

      {isLoading && (
        <Box
          sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}
        >
          <CircularProgress />
        </Box>
      )}
      {error && (
        <Typography variant="body2" color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default BlockView;
