import React, { useEffect, useState, useRef, startTransition, Suspense } from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import PropTypes from 'prop-types';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

// Utility function to fetch block data
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

    return await response.json();
  } catch (error) {
    console.error('Error fetching block data:', error);
    throw error;
  }
};

// TensorMesh Component
const TensorMesh = React.memo(({ value, dims, varName, setHoveredInfo, position }) => {
  let rows = 1;
  let cols = 1;

  if (dims.length === 1) {
    cols = dims[0];
  } else if (dims.length === 2) {
    [rows, cols] = dims;
  }

  const ensureValidData = (value) => {
    if (value == null) return [];
    if (Array.isArray(value)) {
      return value.flat(Infinity).filter(val => val != null);
    }
    return [value];
  };

  const tensorData = ensureValidData(value);

  if (tensorData.length === 0) {
    return (
      <group position={position}>
        <Text
          position={[0, 2, 0]}
          fontSize={1}
          color="black"
          anchorX="center"
          anchorY="middle"
        >
          {varName} (No Data)
        </Text>
      </group>
    );
  }

  const minVal = Math.min(...tensorData);
  const maxVal = Math.max(...tensorData);
  const boxes = [];

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const idx = i * cols + j;
      const val = tensorData[idx] ?? 0;
      const normalizedVal = maxVal === minVal ? 0.5 : (val - minVal) / (maxVal - minVal || 1);
      
      const interpolateColor = (value) => {
        const r = Math.round(255 * value);
        const g = 0;
        const b = Math.round(255 * (1 - value));
        return `rgb(${r}, ${g}, ${b})`;
      };

      boxes.push(
        <mesh
          key={`${varName}-${i}-${j}`}
          position={[j - cols / 2, -i + rows / 2, 0]}
          onPointerOver={(e) => {
            e.stopPropagation();
            startTransition(() => {
              setHoveredInfo({
                varName,
                indices: [i, j],
                value: tensorData[idx] ?? 'N/A'
              });
            });
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            startTransition(() => {
              setHoveredInfo(null);
            });
          }}
        >
          <boxGeometry args={[0.9, 0.9, 0.9]} />
          <meshStandardMaterial color={interpolateColor(normalizedVal)} />
        </mesh>
      );
    }
  }

  return (
    <group position={position}>
      <Text
        position={[0, rows / 2 + 2, 0]}
        fontSize={1}
        color="black"
        anchorX="center"
        anchorY="middle"
      >
        {varName}
      </Text>
      {boxes}
    </group>
  );
});

TensorMesh.propTypes = {
  value: PropTypes.any.isRequired,
  dims: PropTypes.array.isRequired,
  varName: PropTypes.string.isRequired,
  setHoveredInfo: PropTypes.func.isRequired,
  position: PropTypes.arrayOf(PropTypes.number).isRequired,
};

// CustomCameraControls Component
const CustomCameraControls = () => {
  const { camera, gl } = useThree();
  const cameraRotation = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = gl.domElement;
    if (!canvas) return;

    const handleKeyDown = (event) => {
      const PAN_SPEED = 1;
      const ZOOM_SPEED = 2;

      switch (event.key.toLowerCase()) {
        case 'w': camera.position.y += PAN_SPEED; break;
        case 's': camera.position.y -= PAN_SPEED; break;
        case 'a': camera.position.x -= PAN_SPEED; break;
        case 'd': camera.position.x += PAN_SPEED; break;
        case 'o': camera.position.z -= ZOOM_SPEED; break;
        case 'p': camera.position.z += ZOOM_SPEED; break;
        default: break;
      }
      camera.updateProjectionMatrix();
    };

    const handleMouseDown = (event) => {
      isDragging.current = true;
      previousMousePosition.current = {
        x: event.clientX,
        y: event.clientY,
      };
    };

    const handleMouseMove = (event) => {
      if (isDragging.current) {
        const deltaMove = {
          x: event.clientX - previousMousePosition.current.x,
          y: event.clientY - previousMousePosition.current.y,
        };

        const TILT_SPEED = 0.005;
        cameraRotation.current.y -= deltaMove.x * TILT_SPEED;
        cameraRotation.current.x -= deltaMove.y * TILT_SPEED;
        cameraRotation.current.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, cameraRotation.current.x));

        camera.setRotationFromEuler(cameraRotation.current);
        previousMousePosition.current = { x: event.clientX, y: event.clientY };
      }
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    const handleWheel = (event) => {
      const ZOOM_SPEED = 0.1;
      camera.position.z += event.deltaY * ZOOM_SPEED;
      camera.position.z = Math.max(20, Math.min(200, camera.position.z));
      camera.updateProjectionMatrix();
    };

    const addListener = (element, event, handler) => {
      if (element) element.addEventListener(event, handler);
    };

    addListener(window, 'keydown', handleKeyDown);
    addListener(canvas, 'mousedown', handleMouseDown);
    addListener(canvas, 'mousemove', handleMouseMove);
    addListener(window, 'mouseup', handleMouseUp);
    addListener(canvas, 'wheel', handleWheel);

    return () => {
      const removeListener = (element, event, handler) => {
        if (element) element.removeEventListener(event, handler);
      };

      removeListener(window, 'keydown', handleKeyDown);
      removeListener(canvas, 'mousedown', handleMouseDown);
      removeListener(canvas, 'mousemove', handleMouseMove);
      removeListener(window, 'mouseup', handleMouseUp);
      removeListener(canvas, 'wheel', handleWheel);
    };
  }, [camera, gl]);

  useFrame(() => {
    camera.updateProjectionMatrix();
  });

  return null;
};

// TensorsVisualization Component
const TensorsVisualization = React.memo(({ tensorVariables, setHoveredInfo }) => {
  const spacing = 50;
  const numTensors = tensorVariables.length;
  const totalWidth = (numTensors - 1) * spacing;

  return (
    <Box sx={{ position: 'relative', height: '700px', width: '100%' }}>
      <Canvas
        style={{ height: '100%', width: '100%' }}
        camera={{ position: [0, 0, 100], fov: 45 }}
      >
        <ambientLight />
        <pointLight position={[10, 10, 10]} />
        <CustomCameraControls />
        <group position={[-totalWidth / 2, 0, 0]}>
          {tensorVariables.map(([key, variable], index) => {
            const { value, dims } = variable;
            const validDims = dims.filter((dim) => dim > 0);
            const tensorPosition = [index * spacing, 0, 0];
            return (
              <TensorMesh
                key={key}
                value={value}
                dims={validDims}
                varName={key}
                setHoveredInfo={setHoveredInfo}
                position={tensorPosition}
              />
            );
          })}
        </group>
      </Canvas>
    </Box>
  );
});

TensorsVisualization.propTypes = {
  tensorVariables: PropTypes.arrayOf(PropTypes.array).isRequired,
  setHoveredInfo: PropTypes.func.isRequired,
};

// Main BlockView Component
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
        const resultLine = findLineNumber(result.source_line);
        if (resultLine <= currLine && result.changed_vars) {
          Object.entries(result.changed_vars).forEach(([key, value]) => {
            newVariables[key] = {
              value: typeof value === 'object' ? value.data : value,
              dims: value.dims || [-1, -1, -1],
            };
          });
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
    return validDims.length >= 1 && validDims.length <= 2;
  });

  const nonTensorVariables = Object.entries(variables).filter(([, variable]) => {
    const { dims } = variable;
    const validDims = dims.filter((dim) => dim > 0);
    return validDims.length === 0 || validDims.length > 2;
  });

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
                        backgroundColor: 'rgba(255,255,255,0.9)',
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