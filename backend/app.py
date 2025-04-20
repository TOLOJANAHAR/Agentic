from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict
import json
import asyncio
from pydantic import BaseModel
from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage, AIMessage
from dotenv import load_dotenv
import os
import logging
import openai

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Verify OpenAI API key
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    logger.error("OPENAI_API_KEY environment variable is not set")
    raise ValueError("OPENAI_API_KEY environment variable is not set")
else:
    logger.info("OpenAI API key is set")

# Configure OpenAI
openai.api_key = openai_api_key
logger.info("OpenAI API configured")

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize LangChain with error handling
try:
    llm = ChatOpenAI(
        model_name=os.getenv("MODEL_NAME", "gpt-3.5-turbo"),
        temperature=float(os.getenv("TEMPERATURE", 0.7)),
        max_tokens=int(os.getenv("MAX_TOKENS", 1000)),
        openai_api_key=openai_api_key
    )
    logger.info("Successfully initialized LangChain with OpenAI")
except Exception as e:
    logger.error(f"Failed to initialize LangChain: {str(e)}")
    raise

# Store active connections and chat history
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.chat_history: Dict[str, List[Dict]] = {}

    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections.append(websocket)
        if client_id not in self.chat_history:
            self.chat_history[client_id] = []
        logger.info(f"Client {client_id} connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        logger.info(f"Client disconnected. Total connections: {len(self.active_connections)}")

    async def send_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)
        logger.info(f"Sent message to client: {message[:100]}...")

    def add_to_history(self, client_id: str, message: Dict):
        if client_id not in self.chat_history:
            self.chat_history[client_id] = []
        self.chat_history[client_id].append(message)
        logger.info(f"Added message to history for client {client_id}: {message['role']} - {message['content'][:100]}...")

    def get_history(self, client_id: str) -> List[Dict]:
        return self.chat_history.get(client_id, [])

    def reset_history(self, client_id: str):
        self.chat_history[client_id] = []
        logger.info(f"Reset history for client {client_id}")

manager = ConnectionManager()

class Message(BaseModel):
    content: str
    client_id: str

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket, client_id)
    try:
        while True:
            data = await websocket.receive_text()
            logger.info(f"Received message from client {client_id}: {data[:100]}...")
            
            message_data = json.loads(data)
            
            # Add user message to history
            manager.add_to_history(client_id, {"role": "user", "content": message_data["content"]})
            
            # Get chat history for context
            history = manager.get_history(client_id)
            logger.info(f"Current history length for client {client_id}: {len(history)}")
            
            # Prepare messages for LangChain
            messages = []
            for msg in history:
                if msg["role"] == "user":
                    messages.append(HumanMessage(content=msg["content"]))
                else:
                    messages.append(AIMessage(content=msg["content"]))
            
            logger.info("Generating response from LangChain...")
            # Get response from LangChain
            response = await llm.agenerate([messages])
            ai_response = response.generations[0][0].text
            logger.info(f"Generated response: {ai_response[:100]}...")
            
            # Add AI response to history
            manager.add_to_history(client_id, {"role": "assistant", "content": ai_response})
            
            # Send response back to client
            response_data = {
                "type": "response",
                "content": ai_response
            }
            await manager.send_message(json.dumps(response_data), websocket)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"Error in WebSocket connection: {str(e)}")
        manager.disconnect(websocket)

@app.post("/chat")
async def chat(message: Message):
    try:
        logger.info(f"Received chat request from client {message.client_id}: {message.content[:100]}...")
        
        # Add user message to history
        manager.add_to_history(message.client_id, {"role": "user", "content": message.content})
        
        # Get chat history for context
        history = manager.get_history(message.client_id)
        logger.info(f"Current history length for client {message.client_id}: {len(history)}")
        
        # Prepare messages for LangChain
        messages = []
        for msg in history:
            if msg["role"] == "user":
                messages.append(HumanMessage(content=msg["content"]))
            else:
                messages.append(AIMessage(content=msg["content"]))
        
        logger.info("Generating response from LangChain...")
        try:
            # Get response from LangChain
            response = await llm.agenerate([messages])
            ai_response = response.generations[0][0].text
            logger.info(f"Generated response: {ai_response[:100]}...")
        except Exception as e:
            logger.error(f"Error generating response from LangChain: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error generating response: {str(e)}")
        
        # Add AI response to history
        manager.add_to_history(message.client_id, {"role": "assistant", "content": ai_response})
        
        return {"response": ai_response}
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/history/{client_id}")
async def get_history(client_id: str):
    logger.info(f"Fetching history for client {client_id}")
    return {"history": manager.get_history(client_id)}

@app.post("/reset/{client_id}")
async def reset_conversation(client_id: str):
    logger.info(f"Resetting conversation for client {client_id}")
    manager.reset_history(client_id)
    return {"message": "Conversation reset successfully"}

@app.get("/")
async def root():
    return {"message": "Agent Chat API is running"}

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting server...")
    uvicorn.run(app, host="localhost", port=8000) 