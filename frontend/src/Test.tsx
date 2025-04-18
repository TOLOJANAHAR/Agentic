import React from 'react';
import { Box, Typography } from '@mui/material';

const Test: React.FC = () => {
  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0f0f0',
      }}
    >
      <Typography variant="h4" color="primary">
        Hello from Test Component!
      </Typography>
    </Box>
  );
};

export default Test;
