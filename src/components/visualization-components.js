import React, { useEffect, useRef, startTransition } from 'react';
import { Box } from '@mui/material';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import PropTypes from 'prop-types';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

// Store colors for variables
const variableColorMap = new Map();

// Generate a random color for a variable
const getVariableColor = (varName) => {
  if (variableColorMap.has(varName)) {
    return variableColorMap.get(varName);
  }

  // Generate a new color using HSL for better distribution
  const hue = Math.random();
  const saturation = 0.7 + Math.random() * 0.3; // 0.7-1.0
  const lightness = 0.4 + Math.random() * 0.2;  // 0.4-0.6

  // Convert HSL to RGB
  const h = hue;
  const s = saturation;
  const l = lightness;
  
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  
  const color = {
    r: Math.round(hue2rgb(p, q, h + 1/3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1/3) * 255)
  };

  variableColorMap.set(varName, color);
  return color;
};

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

    const data = await response.json();  // Await the JSON response
    console.log('Received data:', data); // Log the data
    return data;
  } catch (error) {
    console.error('Error fetching block data:', error);
    throw error;
  }
};


// TensorMesh Component

const TensorMesh = React.memo(({ value, dims, varName, highlightedIndices, setHoveredInfo, position }) => {
  let rows = 1;
  let cols = 1;
  let depths = 1;
  let boxes = [];
  const varColor = getVariableColor(varName);

  // Variables to hold matching indices and tensor dimensions
  let matchingSet = new Set();
  let validDims = [];

  // Check if value has highlighted_coords and shape
  if (value && value.highlighted_coords && value.shape) {
    const shape = value.shape;
    validDims = shape.filter((dim) => dim > 0);

    // Set tensor dimensions based on shape
    if (validDims.length === 1) {
      cols = validDims[0];
    } else if (validDims.length === 2) {
      [rows, cols] = validDims;
    } else if (validDims.length === 3) {
      [rows, cols, depths] = validDims;
    }

    // Create a set of matching indices for quick lookup
    matchingSet = new Set(
      value.highlighted_coords.map(indices => indices.join(','))
    );

    // Generate boxes with special coloring logic
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        for (let k = 0; k < depths; k++) {
          const indexKey = [i, j, k].slice(0, validDims.length).join(',');
          const isMatching = matchingSet.has(indexKey);

          boxes.push(
            <mesh
              key={`${varName}-${i}-${j}-${k}`}
              position={[
                j - cols / 2,
                -i + rows / 2,
                k - depths / 2,
              ]}
              onPointerOver={(e) => {
                e.stopPropagation();
                startTransition(() => {
                  setHoveredInfo({
                    varName,
                    indices: [i, j, k],
                    value: isMatching ? 'Matched' : 'Not Matched'
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
              <meshStandardMaterial color={isMatching ? `rgb(${varColor.r}, ${varColor.g}, ${varColor.b})` : 'lightgrey'} />
              <lineSegments>
                <edgesGeometry attach="geometry" args={[new THREE.BoxGeometry(0.9, 0.9, 0.9)]} />
                <lineBasicMaterial attach="material" color="black" />
              </lineSegments>
            </mesh>
          );
        }
      }
    }
  } else {
    // Existing logic for tensors without highlighted_coords and shape
    // Ensure valid dimensions
    validDims = dims.filter((dim) => dim > 0);
    if (validDims.length === 1) {
      cols = validDims[0];
    } else if (validDims.length === 2) {
      [rows, cols] = validDims;
    } else if (validDims.length === 3) {
      [rows, cols, depths] = validDims;
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

    // Generate boxes with original coloring logic
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        for (let k = 0; k < depths; k++) {
          const idx = i * cols * depths + j * depths + k;
          const val = tensorData[idx] ?? 0;
          const intensity = maxVal === minVal ? 0.5 : (val - minVal) / (maxVal - minVal || 1);

          const interpolateColor = (intensity) => {
            const r = Math.round(255 - (255 - varColor.r) * intensity);
            const g = Math.round(255 - (255 - varColor.g) * intensity);
            const b = Math.round(255 - (255 - varColor.b) * intensity);
            return `rgb(${r}, ${g}, ${b})`;
          };

          // Check if the current element should be highlighted
          const indexKey = [i, j, k].slice(0, validDims.length).join(',');
          const isHighlighted = highlightedIndices?.some(indices => indices.join(',') === indexKey);

          boxes.push(
            <mesh
              key={`${varName}-${i}-${j}-${k}`}
              position={[
                j - cols / 2,
                -i + rows / 2,
                k - depths / 2,
              ]}
              onPointerOver={(e) => {
                e.stopPropagation();
                startTransition(() => {
                  setHoveredInfo({
                    varName,
                    indices: [i, j, k],
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
              <meshStandardMaterial color={isHighlighted ? 'yellow' : interpolateColor(intensity)} />
              <lineSegments>
                <edgesGeometry attach="geometry" args={[new THREE.BoxGeometry(0.9, 0.9, 0.9)]} />
                <lineBasicMaterial attach="material" color="black" />
              </lineSegments>
            </mesh>
          );
        }
      }
    }
  }

  return (
    <group position={position}>
      <Text
        position={[0, rows / 2 + 2, 0]}
        fontSize={1}
        color={`rgb(${varColor.r}, ${varColor.g}, ${varColor.b})`}
        anchorX="center"
        anchorY="middle"
      >
        {varName}
      </Text>
      {boxes}
    </group>
  );
});


const CustomCameraControls = ({ onCameraReady }) => {
  const { camera, gl } = useThree();
  const cameraRotation = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const initialPosition = useRef(camera.position.clone());

  useEffect(() => {
    if (onCameraReady) {
      onCameraReady({
        focusOnPosition: (position) => {
          // Reset rotation
          cameraRotation.current.set(0, 0, 0, 'YXZ');
          camera.setRotationFromEuler(cameraRotation.current);
          
          // Move camera to focus position
          camera.position.set(
            position[0],
            position[1] + 20,
            position[2] + 100
          );
          camera.lookAt(position[0], position[1], position[2]);
          camera.updateProjectionMatrix();
        },
        resetView: () => {
          camera.position.copy(initialPosition.current);
          cameraRotation.current.set(0, 0, 0, 'YXZ');
          camera.setRotationFromEuler(cameraRotation.current);
          camera.updateProjectionMatrix();
        }
      });
    }

    const canvas = gl.domElement;
    if (!canvas) return;

    const handleKeyDown = (event) => {
      const PAN_SPEED = 1;
      const ZOOM_SPEED = 2;
      const ROTATE_SPEED = 0.05;

      switch (event.key) {
        case 'ArrowUp':
          cameraRotation.current.x -= ROTATE_SPEED;
          cameraRotation.current.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, cameraRotation.current.x));
          camera.setRotationFromEuler(cameraRotation.current);
          break;
        case 'ArrowDown':
          cameraRotation.current.x += ROTATE_SPEED;
          cameraRotation.current.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, cameraRotation.current.x));
          camera.setRotationFromEuler(cameraRotation.current);
          break;
        case 'ArrowLeft':
          cameraRotation.current.y -= ROTATE_SPEED;
          camera.setRotationFromEuler(cameraRotation.current);
          break;
        case 'ArrowRight':
          cameraRotation.current.y += ROTATE_SPEED;
          camera.setRotationFromEuler(cameraRotation.current);
          break;
        case 'w':
        case 'W':
          camera.position.y += PAN_SPEED;
          break;
        case 's':
        case 'S':
          camera.position.y -= PAN_SPEED;
          break;
        case 'a':
        case 'A':
          camera.position.x -= PAN_SPEED;
          break;
        case 'd':
        case 'D':
          camera.position.x += PAN_SPEED;
          break;
        case 'o':
        case 'O':
          camera.position.z -= ZOOM_SPEED;
          break;
        case 'p':
        case 'P':
          camera.position.z += ZOOM_SPEED;
          break;
        default:
          break;
      }
      camera.updateProjectionMatrix();
    };

    const handleWheel = (event) => {
      const ZOOM_SPEED = 0.1;
      camera.position.z += event.deltaY * ZOOM_SPEED;
      camera.position.z = Math.max(20, Math.min(200, camera.position.z));
      camera.updateProjectionMatrix();
    };

    window.addEventListener('keydown', handleKeyDown);
    canvas.addEventListener('wheel', handleWheel);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [camera, gl, onCameraReady]);

  useFrame(() => {
    camera.updateProjectionMatrix();
  });

  return null;
};

// TensorMesh component stays the same...

const TensorsVisualization = React.memo(({ tensorVariables, setHoveredInfo, onCameraControlsReady }) => {
  const spacing = 50;
  const numTensors = tensorVariables.length;
  const totalWidth = (numTensors - 1) * spacing;
  
  const handleCameraReady = (controls) => {
    if (onCameraControlsReady) {
      onCameraControlsReady(controls);
    }
  };

  return (
    <Box sx={{ position: 'relative', height: '700px', width: '100%' }}>
      <Canvas
        style={{ height: '100%', width: '100%' }}
        camera={{ position: [0, 0, 100], fov: 45 }}
      >
        <ambientLight />
        <pointLight position={[10, 10, 10]} />
        <CustomCameraControls onCameraReady={handleCameraReady} />
        <group position={[-totalWidth / 2, 0, 0]}>
          {tensorVariables.map(([key, variable], index) => {
            const { value, dims, highlighted_indices } = variable;
            const validDims = dims.filter((dim) => dim > 0);
            const tensorPosition = [index * spacing, 0, 0];
            return (
              <TensorMesh
                key={key}
                value={value}
                dims={validDims}
                varName={key}
                highlightedIndices={highlighted_indices}
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

CustomCameraControls.propTypes = {
  onCameraReady: PropTypes.func,
};

TensorsVisualization.propTypes = {
  tensorVariables: PropTypes.arrayOf(PropTypes.array).isRequired,
  setHoveredInfo: PropTypes.func.isRequired,
  onCameraControlsReady: PropTypes.func,
};

export { fetchAndLogBlockData, TensorsVisualization };