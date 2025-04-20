import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  TextField,
  IconButton,
  AppBar,
  Toolbar,
  Typography,
  Paper,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import MenuIcon from '@mui/icons-material/Menu';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from './store';
import {
  addMessage,
  createConversation,
  setLoading,
  setError,
} from './store/chatSlice';
import MessageBubble from './components/MessageBubble';
import TypingIndicator from './components/TypingIndicator';
import Sidebar from './components/Sidebar';
import { api } from './services/api';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
}

const App: React.FC = () => {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [clientId] = useState(() => Math.random().toString(36).substring(7));
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();
  const { conversations, currentConversationId, isLoading } = useSelector(
    (state: RootState) => state.chat
  );

  const currentConversation = conversations.find(
    (conv) => conv.id === currentConversationId
  );

  useEffect(() => {
    if (!currentConversationId && conversations.length === 0) {
      dispatch(createConversation());
    }
  }, [currentConversationId, conversations.length, dispatch]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation?.messages]);

  useEffect(() => {
    if (error) {
      setSnackbarMessage(error);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  }, [error]);

  const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    if (!currentConversationId) {
      setError('No active conversation');
      setSnackbarOpen(true);
      return;
    }

    const userMessage = {
      conversationId: currentConversationId,
      message: {
        content: input,
        role: 'user' as const,
      }
    };

    dispatch(addMessage(userMessage));
    setInput('');
    setIsTyping(true);

    try {
      console.log('Sending message to backend...');
      const response = await api.sendMessage(input, clientId);
      console.log('Received response from backend:', response);
      
      const aiMessage = {
        conversationId: currentConversationId,
        message: {
          content: response.response,
          role: 'assistant' as const,
        }
      };
      
      dispatch(addMessage(aiMessage));
    } catch (error: any) {
      console.error('Error sending message:', error);
      setError(error.response?.data?.detail || error.message || 'Failed to send message');
      setSnackbarOpen(true);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            Agent Chat
          </Typography>
        </Toolbar>
      </AppBar>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - 240px)` },
          ml: { sm: '240px' },
        }}
      >
        <Toolbar />
        <Container maxWidth="md" sx={{ height: 'calc(100% - 64px)' }}>
          <Paper
            elevation={3}
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              p: 2,
            }}
          >
            <Box
              sx={{
                flexGrow: 1,
                overflow: 'auto',
                mb: 2,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {currentConversation?.messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {isLoading && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                multiline
                maxRows={4}
                disabled={isLoading}
              />
              <IconButton
                color="primary"
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                sx={{ alignSelf: 'flex-end' }}
              >
                {isLoading ? <CircularProgress size={24} /> : <SendIcon />}
              </IconButton>
            </Box>
          </Paper>
        </Container>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default App; 