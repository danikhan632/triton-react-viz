// GridBlock.jsx
import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';

const fetchAndLogBlockData = (gridX, gridY, gridZ) => {
  console.log('Fetching data for block:', gridX, gridY, gridZ);

  return fetch('http://73.106.153.51:5002/process_blocks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      x: gridX,
      y: gridY,
      z: gridZ
    })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    console.log('Received data for block:', gridX, gridY, gridZ);
    console.log(data);
    return data;
  })
  .catch(error => {
    console.error('Error fetching block data:', error);
    throw error;
  });
};

const GridBlock = ({ data }) => {
  const [processedData, setProcessedData] = useState(null);
  const [isResultPopupOpen, setIsResultPopupOpen] = useState(false);

  useEffect(() => {
    fetchAndLogBlockData(data.x, data.y, data.z)
      .then(setProcessedData)
      .catch(error => console.error('Failed to fetch block data:', error));
  }, [data.x, data.y, data.z]);

  const handleOpenResult = () => {
    setIsResultPopupOpen(true);
  };

  const handleCloseResult = () => {
    setIsResultPopupOpen(false);
  };

  return (
    <>
      <Box 
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
        {processedData && (
          <>
            <Typography variant="caption">Processed</Typography>
            <Button 
              variant="text" 
              size="small" 
              onClick={handleOpenResult} 
              sx={{ mt: 1, color: 'primary.light' }}
            >
              View Results
            </Button>
          </>
        )}
      </Box>

      {/* Result Details Dialog */}
      <Dialog open={isResultPopupOpen} onClose={handleCloseResult} maxWidth="sm" fullWidth>
        <DialogTitle>Result Details for Block {`${data.x},${data.y},${data.z}`}</DialogTitle>
        <DialogContent>
          {processedData && processedData.results && processedData.results.length > 0 ? (
            processedData.results.map((result, index) => (
              <Box key={index} sx={{ mb: 2 }}>
                <Typography variant="subtitle2">Result {index + 1}:</Typography>
                <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(result, null, 2)}
                </Typography>
              </Box>
            ))
          ) : (
            <Typography variant="body2">No results available for this block.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResult}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default GridBlock;
