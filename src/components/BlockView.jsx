import React, { useEffect, useState, startTransition, Suspense } from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import PropTypes from 'prop-types';
import { fetchAndLogBlockData, TensorsVisualization } from './visualization-components';

const BlockView = ({
  currBlock,
  setCurrBlock,
  currLine,
  codeLines,
  setProcessedData,
  processedData,
}) => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [variables, setVariables] = useState({});
  const [hoveredInfo, setHoveredInfo] = useState(null);

  const findLineNumber = (sourceLine) => {
    for (let i = 0; i < codeLines.length; i++) {
      if (codeLines[i].trim() === sourceLine.trim()) {
        return i + 1;
      }
    }
    return -1;
  };

  const updateVariables = (data) => {
    if (data?.results) {
      const newVariables = {};
      
        data.results.forEach((result) => {
          try {
          const resultLine = findLineNumber(result.source_line);
          if (resultLine <= currLine && result.changed_vars) {
            Object.entries(result.changed_vars).forEach(([key, value]) => {
              newVariables[key] = {
                value: typeof value === 'object' ? value.data : value,
                dims: value.dims || [-1, -1, -1],
                highlighted_indices: value.highlighted_indices || [],
              };
            });
          }
        } catch (error) {
          console.error('Error updating variables:', error);
          console.error(result);
        }
        });
        setVariables(newVariables);
  
    }
  };
  

  useEffect(() => {
    if (!currBlock) {
      startTransition(() => {
        setVariables({});
        setProcessedData(null);
      });
      return;
    }

    let isMounted = true;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchAndLogBlockData(
          currBlock.x,
          currBlock.y,
          currBlock.z
        );
        if (isMounted) {
          startTransition(() => {
            setProcessedData(data);
            updateVariables(data);
          });
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to fetch block data.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [currBlock, setProcessedData]);

  useEffect(() => {
    if (processedData) {
      startTransition(() => {
        updateVariables(processedData);
      });
    }
  }, [currLine, processedData]);

  const handleBackClick = () => {
    startTransition(() => {
      setCurrBlock(null);
      setProcessedData(null);
    });
  };

  const tensorVariables = Object.entries(variables).filter(([, variable]) => {
    const { dims } = variable;
    const validDims = dims.filter((dim) => dim > 0);
    return validDims.length >= 1 && validDims.length <= 3;
  });

  const nonTensorVariables = Object.entries(variables).filter(([, variable]) => {
    const { dims } = variable;
    const validDims = dims.filter((dim) => dim > 0);
    return validDims.length === 0 || validDims.length > 3;
  });
  console.log('nonTensorVariables', nonTensorVariables);

  return (
    <Box>
      <Button onClick={handleBackClick} variant="contained" sx={{ mb: 2 }}>
        Back
      </Button>
      <Typography variant="h6">
        Block View for Block{' '}
        {currBlock ? `${currBlock.x},${currBlock.y},${currBlock.z}` : ''}
      </Typography>

      <Box sx={{ mt: 2, mb: 2, p: 2, border: '1px solid #ccc', borderRadius: 2 }}>
        <Typography variant="h6">Variables (Line {currLine}):</Typography>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {nonTensorVariables.length > 0 && (
              <Box sx={{ mb: 2 }}>
                {nonTensorVariables.map(([key, variable]) => (
                  <Typography key={key} variant="body2">
                    {key}: {JSON.stringify(variable.value)}
                  </Typography>
                ))}
              </Box>
            )}

            {tensorVariables.length > 0 ? (
              <Suspense fallback={<CircularProgress />}>
                <Box sx={{ height: '700px', width: '100%', mb: 2, position: 'relative' }}>
                <TensorsVisualization 
                    tensorVariables={tensorVariables}
                    setHoveredInfo={setHoveredInfo}
                  />
                  {hoveredInfo && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        padding: '10px',
                        backgroundColor: 'rgba(0,0,0,0.9)',
                        borderRadius: '8px',
                        boxShadow: '0 0 10px rgba(0,0,0,0.3)',
                        zIndex: 1000,
                      }}
                    >
                      <Typography variant="body2">
                        <strong>{hoveredInfo.varName}</strong> [{hoveredInfo.indices.join(',')}]: {hoveredInfo.value}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Suspense>
            ) : (
              <Typography variant="body2">
                No tensor variables to display.
              </Typography>
            )}

            {tensorVariables.length === 0 && nonTensorVariables.length === 0 && (
              <Typography variant="body2">No variables defined yet.</Typography>
            )}
          </>
        )}
      </Box>

      {error && (
        <Typography variant="body2" color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
};

BlockView.propTypes = {
  currBlock: PropTypes.object,
  setCurrBlock: PropTypes.func.isRequired,
  currLine: PropTypes.number,
  codeLines: PropTypes.array.isRequired,
  setProcessedData: PropTypes.func.isRequired,
  processedData: PropTypes.object,
};

export default BlockView;