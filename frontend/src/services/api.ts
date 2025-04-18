import axios from 'axios';
import { Message } from '../types/chat';

const API_BASE_URL = 'http://localhost:8000';

export const api = {
  sendMessage: async (content: string, clientId: string) => {
    const response = await axios.post(`${API_BASE_URL}/chat`, {
      content,
      client_id: clientId,
    });
    return response.data;
  },

  getHistory: async (clientId: string) => {
    const response = await axios.get(`${API_BASE_URL}/history/${clientId}`);
    return response.data;
  },

  resetConversation: async (clientId: string) => {
    const response = await axios.post(`${API_BASE_URL}/reset/${clientId}`);
    return response.data;
  },
}; 