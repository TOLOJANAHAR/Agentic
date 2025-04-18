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

# Load environment variables
load_dotenv()

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize LangChain
llm = ChatOpenAI(
    model_name=os.getenv("MODEL_NAME", "gpt-3.5-turbo"),
    temperature=float(os.getenv("TEMPERATURE", 0.7)),
    max_tokens=int(os.getenv("MAX_TOKENS", 1000))
)

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

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    def add_to_history(self, client_id: str, message: Dict):
        if client_id not in self.chat_history:
            self.chat_history[client_id] = []
        self.chat_history[client_id].append(message)

    def get_history(self, client_id: str) -> List[Dict]:
        return self.chat_history.get(client_id, [])

    def reset_history(self, client_id: str):
        self.chat_history[client_id] = []

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
            message_data = json.loads(data)
            
            # Add user message to history
            manager.add_to_history(client_id, {"role": "user", "content": message_data["content"]})
            
            # Get chat history for context
            history = manager.get_history(client_id)
            
            # Prepare messages for LangChain
            messages = []
            for msg in history:
                if msg["role"] == "user":
                    messages.append(HumanMessage(content=msg["content"]))
                else:
                    messages.append(AIMessage(content=msg["content"]))
            
            # Get response from LangChain
            response = await llm.agenerate([messages])
            ai_response = response.generations[0][0].text
            
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

@app.post("/chat")
async def chat(message: Message):
    try:
        # Add user message to history
        manager.add_to_history(message.client_id, {"role": "user", "content": message.content})
        
        # Get chat history for context
        history = manager.get_history(message.client_id)
        
        # Prepare messages for LangChain
        messages = []
        for msg in history:
            if msg["role"] == "user":
                messages.append(HumanMessage(content=msg["content"]))
            else:
                messages.append(AIMessage(content=msg["content"]))
        
        # Get response from LangChain
        response = await llm.agenerate([messages])
        ai_response = response.generations[0][0].text
        
        # Add AI response to history
        manager.add_to_history(message.client_id, {"role": "assistant", "content": ai_response})
        
        return {"response": ai_response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/history/{client_id}")
async def get_history(client_id: str):
    return {"history": manager.get_history(client_id)}

@app.post("/reset/{client_id}")
async def reset_conversation(client_id: str):
    manager.reset_history(client_id)
    return {"message": "Conversation reset successfully"}

@app.get("/")
async def root():
    return {"message": "Agent Chat API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 