import React, { useState, useEffect, useRef } from 'react';
import { 
  Container, 
  Box, 
  TextField, 
  Button, 
  Paper, 
  Typography,
  List,
  ListItem,
  ListItemText,
  AppBar,
  Toolbar
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

interface Message {
  type: 'user' | 'response';
  content: string;
}

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws');
    
    ws.onopen = () => {
      console.log('Connected to WebSocket');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages(prev => [...prev, { type: 'response', content: data.content }]);
    };

    ws.onclose = () => {
      console.log('Disconnected from WebSocket');
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (input.trim() && socket) {
      const message = input.trim();
      setMessages(prev => [...prev, { type: 'user', content: message }]);
      socket.send(message);
      setInput('');
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <Box sx={{ flexGrow: 1, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Agent Chat
          </Typography>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="md" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', py: 2 }}>
        <Paper 
          elevation={3} 
          sx={{ 
            flexGrow: 1, 
            mb: 2, 
            p: 2, 
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <List>
            {messages.map((message, index) => (
              <ListItem key={index} sx={{ 
                justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
                mb: 1
              }}>
                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    maxWidth: '70%',
                    backgroundColor: message.type === 'user' ? '#1976d2' : '#f5f5f5',
                    color: message.type === 'user' ? 'white' : 'black'
                  }}
                >
                  <ListItemText primary={message.content} />
                </Paper>
              </ListItem>
            ))}
            <div ref={messagesEndRef} />
          </List>
        </Paper>

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
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleSend}
            disabled={!input.trim()}
            sx={{ minWidth: '100px' }}
          >
            <SendIcon />
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default App; 