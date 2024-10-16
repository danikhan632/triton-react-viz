// GridViewComponent.jsx
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Slider, 
  Typography, 
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';

const GridViewComponent = () => {
  const [globalData, setGlobalData] = useState(null);
  const [currentView, setCurrentView] = useState('main');
  const [maxValues, setMaxValues] = useState([0, 0, 0]);
  const [currentBlockData, setCurrentBlockData] = useState(null);
  const [sliderValues, setSliderValues] = useState([-1, -1, -1]);  // Default to -1 for no filtering
  const [isInfoPopupOpen, setIsInfoPopupOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('http://73.106.153.51:5002/api/data');
      const data = await response.json();
      setGlobalData(data);
      console.log(data.ops.visualization_data);
      determineMaxValues(data.ops.visualization_data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const determineMaxValues = (visualizationData) => {
    console.log('determineMaxValues:', visualizationData);
    const keys = Object.keys(visualizationData);
    if (keys.length === 0) {
      setMaxValues([0, 0, 0]);
      return;
    }

    const maxVals = keys.reduce(
      (max, key) => {
        const [x, y, z] = key.split('_').map(Number);
        return [
          Math.max(max[0], x),
          Math.max(max[1], y),
          Math.max(max[2], z),
        ];
      },
      [0, 0, 0]
    );

    setMaxValues(maxVals);
    console.log('Max values:', maxVals);
  };

  const handleSliderChange = (index, newValue) => {
    const newSliderValues = [...sliderValues];
    newSliderValues[index] = newValue;
    setSliderValues(newSliderValues);
  };

  const handleBlockClick = (blockData) => {
    setCurrentBlockData(blockData);
    setCurrentView('block');
  };

  const handleBackClick = () => {
    setCurrentView('main');
    setCurrentBlockData(null);
  };

  const handlePrecompute = () => {
    console.log('Precompute clicked');
    // Implement precompute logic here
  };

  const handleInfoClick = () => {
    setIsInfoPopupOpen(true);
  };

  const renderGrid = () => {
    if (!globalData || !globalData.ops || !globalData.ops.visualization_data) return null;

    const [xMax, yMax, zMax] = maxValues;
    const [xSlider, ySlider, zSlider] = sliderValues;

    // Determine the range for each axis: if slider is -1, iterate over all values, otherwise use the slider value.
    const xValues = xSlider === -1 ? Array.from({ length: xMax + 1 }, (_, i) => i) : [xSlider];
    const yValues = ySlider === -1 ? Array.from({ length: yMax + 1 }, (_, i) => i) : [ySlider];
    const zValues = zSlider === -1 ? Array.from({ length: zMax + 1 }, (_, i) => i) : [zSlider];

    return (
      <Grid container spacing={1}>
        {zValues.map((z) => (
          yValues.map((y) => (
            <Grid container item xs={12} spacing={1} key={`row-${y}-${z}`}>
              {xValues.map((x) => {
                const key = `${x}_${y}_${z}`;
                const blockData = globalData.ops.visualization_data[key];

                return (
                  <Grid item key={key}>
                    {blockData ? (
                      <GridBlock
                        data={{
                          x: x,
                          y: y,
                          z: z,
                          operations: blockData,
                        }}
                        onClick={handleBlockClick}
                      />
                    ) : (
                      // Placeholder for missing data
                      <Box
                        sx={{
                          width: 50,
                          height: 50,
                          bgcolor: 'grey.800',
                          border: 1,
                          borderColor: 'grey.700',
                        }}
                      />
                    )}
                  </Grid>
                );
              })}
            </Grid>
          ))
        ))}
      </Grid>
    );
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%', // Fill the parent container's height
      }}
    >
      {currentView === 'main' ? (
        <>
          {/* Grid Display Area */}
          <Box sx={{ flexGrow: 1, overflow: 'auto', mb: 2 }}>
            {renderGrid()}
          </Box>

          {/* Sliders and Precompute Button */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            {['X', 'Y', 'Z'].map((axis, index) => (
              <Box key={axis} sx={{ width: '30%' }}>
                <Typography>{axis} Axis</Typography>
                <Slider
                  value={sliderValues[index]}
                  onChange={(_, newValue) => handleSliderChange(index, newValue)}
                  min={-1}
                  max={maxValues[index]}
                  step={1}
                  marks
                  valueLabelDisplay="auto"
                />
                <Typography variant="caption" sx={{ color: 'grey.500' }}>
                  {sliderValues[index] === -1 ? 'All values' : `Value: ${sliderValues[index]}`}
                </Typography>
              </Box>
            ))}
          </Box>
          <Button onClick={handlePrecompute} variant="contained" sx={{ mt: 2 }}>
            Precompute
          </Button>
        </>
      ) : (
        // Block View
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Button onClick={handleBackClick} variant="contained">
              Back
            </Button>
            <Typography variant="h6">Block View</Typography>
          </Box>
          <Typography component="pre" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {JSON.stringify(currentBlockData, null, 2)}
          </Typography>
        </Box>
      )}

      {/* Info Button */}
      <Button
        onClick={handleInfoClick}
        variant="outlined"
        sx={{ position: 'absolute', top: 10, right: 10 }}
      >
        Info
      </Button>

      {/* Info Dialog */}
      <Dialog open={isInfoPopupOpen} onClose={() => setIsInfoPopupOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Kernel Source Code</DialogTitle>
        <DialogContent>
          <Typography component="pre" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {globalData?.kernel_src || 'No kernel source code available'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsInfoPopupOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const GridBlock = ({ data, onClick }) => (
  <Box 
    onClick={() => onClick(data)}
    sx={{ 
      p: 1, 
      cursor: 'pointer', 
      '&:hover': { bgcolor: 'action.hover' },
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      border: 1,
      borderColor: 'grey.700',
      borderRadius: 1,
      bgcolor: 'grey.800',
    }}
  >
    <Typography variant="caption">{`${data.x},${data.y},${data.z}`}</Typography>
    <Typography variant="body2">Operations: {data.operations.length}</Typography>
  </Box>
);

export default GridViewComponent;
