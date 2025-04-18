import React from 'react';
import { Box, Typography } from '@mui/material';

const TypingIndicator: React.FC = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        mb: 2,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          gap: 0.5,
        }}
      >
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: '#1976d2',
            animation: 'bounce 1.4s infinite ease-in-out',
            '&:nth-of-type(1)': {
              animationDelay: '-0.32s',
            },
            '&:nth-of-type(2)': {
              animationDelay: '-0.16s',
            },
            '@keyframes bounce': {
              '0%, 80%, 100%': {
                transform: 'scale(0)',
              },
              '40%': {
                transform: 'scale(1)',
              },
            },
          }}
        />
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: '#1976d2',
            animation: 'bounce 1.4s infinite ease-in-out',
            '&:nth-of-type(1)': {
              animationDelay: '-0.32s',
            },
            '&:nth-of-type(2)': {
              animationDelay: '-0.16s',
            },
            '@keyframes bounce': {
              '0%, 80%, 100%': {
                transform: 'scale(0)',
              },
              '40%': {
                transform: 'scale(1)',
              },
            },
          }}
        />
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: '#1976d2',
            animation: 'bounce 1.4s infinite ease-in-out',
            '&:nth-of-type(1)': {
              animationDelay: '-0.32s',
            },
            '&:nth-of-type(2)': {
              animationDelay: '-0.16s',
            },
            '@keyframes bounce': {
              '0%, 80%, 100%': {
                transform: 'scale(0)',
              },
              '40%': {
                transform: 'scale(1)',
              },
            },
          }}
        />
      </Box>
      <Typography variant="body2" color="text.secondary">
        Agent is typing...
      </Typography>
    </Box>
  );
};

export default TypingIndicator; 