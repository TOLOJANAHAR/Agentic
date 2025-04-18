import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import { ChatState, Message, Conversation } from '../types/chat';

const initialState: ChatState = {
  conversations: [],
  currentConversationId: null,
  isLoading: false,
  error: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<{ conversationId: string; message: Omit<Message, 'id' | 'timestamp'> }>) => {
      const { conversationId, message } = action.payload;
      const conversation = state.conversations.find(conv => conv.id === conversationId);
      
      if (conversation) {
        const newMessage: Message = {
          ...message,
          id: uuidv4(),
          timestamp: Date.now(),
        };
        conversation.messages.push(newMessage);
        conversation.lastUpdated = Date.now();
      }
    },
    createConversation: (state) => {
      const newConversation: Conversation = {
        id: uuidv4(),
        title: 'New Conversation',
        messages: [],
        lastUpdated: Date.now(),
      };
      state.conversations.push(newConversation);
      state.currentConversationId = newConversation.id;
    },
    setCurrentConversation: (state, action: PayloadAction<string>) => {
      state.currentConversationId = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    deleteConversation: (state, action: PayloadAction<string>) => {
      state.conversations = state.conversations.filter(conv => conv.id !== action.payload);
      if (state.currentConversationId === action.payload) {
        state.currentConversationId = state.conversations[0]?.id || null;
      }
    },
  },
});

export const {
  addMessage,
  createConversation,
  setCurrentConversation,
  setLoading,
  setError,
  deleteConversation,
} = chatSlice.actions;

export default chatSlice.reducer; 