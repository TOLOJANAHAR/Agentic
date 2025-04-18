import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  IconButton,
  Box,
  Typography,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import {
  createConversation,
  setCurrentConversation,
  deleteConversation,
} from '../store/chatSlice';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const { conversations, currentConversationId } = useSelector(
    (state: RootState) => state.chat
  );

  const handleCreateConversation = () => {
    dispatch(createConversation());
  };

  const handleSelectConversation = (id: string) => {
    dispatch(setCurrentConversation(id));
  };

  const handleDeleteConversation = (id: string) => {
    dispatch(deleteConversation(id));
  };

  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={open}
      onClose={onClose}
      sx={{
        width: 240,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 240,
          boxSizing: 'border-box',
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6">Conversations</Typography>
        <IconButton
          onClick={handleCreateConversation}
          sx={{ mt: 1 }}
          color="primary"
        >
          <AddIcon />
        </IconButton>
      </Box>
      <Divider />
      <List>
        {conversations.map((conversation) => (
          <ListItem
            key={conversation.id}
            disablePadding
            secondaryAction={
              <IconButton
                edge="end"
                onClick={() => handleDeleteConversation(conversation.id)}
              >
                <DeleteIcon />
              </IconButton>
            }
          >
            <ListItemButton
              selected={conversation.id === currentConversationId}
              onClick={() => handleSelectConversation(conversation.id)}
            >
              <ListItemText
                primary={conversation.title}
                secondary={new Date(conversation.lastUpdated).toLocaleDateString()}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar; 