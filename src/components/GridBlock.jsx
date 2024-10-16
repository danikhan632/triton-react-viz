import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button,
  List,
  ListItem,
  ListItemText
} from '@mui/material';

const GridBlock = ({ x, y, z, items }) => {
  const [isFullScreen, setIsFullScreen] = useState(false);

  const handleToggleFullScreen = () => setIsFullScreen(!isFullScreen);
  
  const handleBackClick = (e) => {
    e.stopPropagation(); // Prevent the event from bubbling up and toggling back to fullscreen mode
    setIsFullScreen(false); // Exit full-screen mode
  };

  return (
    <Box 
      onClick={isFullScreen ? undefined : handleToggleFullScreen} // Prevent toggle on click when in full-screen mode
      sx={{ 
        position: isFullScreen ? 'fixed' : 'relative',
        top: isFullScreen ? 0 : 'auto',
        left: isFullScreen ? 0 : 'auto',
        right: isFullScreen ? 0 : 'auto',
        bottom: isFullScreen ? 0 : 'auto',
        zIndex: isFullScreen ? 1000 : 1,
        p: isFullScreen ? 4 : 1,
        border: 1, 
        borderColor: 'grey.700', 
        bgcolor: 'grey.800',
        cursor: isFullScreen ? 'auto' : 'pointer', // Remove cursor pointer in full-screen mode
        transition: 'all 0.3s ease-in-out',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': {
          bgcolor: !isFullScreen && 'grey.700', // Only apply hover effect when not in full-screen
        }
      }}
    >
      {isFullScreen && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Button 
            onClick={handleBackClick} // Back button logic to exit fullscreen
            variant="contained" 
            sx={{ alignSelf: 'flex-start' }}
          >
            Back
          </Button>
          <Typography variant="h6" sx={{ color: 'grey.300' }}>
            Grid Block {x}.{y}.{z}
          </Typography>
        </Box>
      )}

      {!isFullScreen && (
        <Typography variant="h6" sx={{ color: 'grey.300', mb: 2 }}>
          Grid Block {x}.{y}.{z}
        </Typography>
      )}

      {isFullScreen ? (
        <>
          <List sx={{ flexGrow: 1 }}>
            {items.map((item, index) => (
              <ListItem key={index}>
                <ListItemText primary={item} sx={{ color: 'white' }} />
              </ListItem>
            ))}
          </List>
        </>
      ) : (
        items.map((item, index) => (
          <Typography key={index} variant="caption" sx={{ color: 'white', display: 'block' }}>
            {item}
          </Typography>
        ))
      )}
    </Box>
  );
};

export default GridBlock;
