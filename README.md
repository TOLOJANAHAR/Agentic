# Agent Chat Application

A full-stack chat application built with React and Python, similar to ChatGPT.

## Project Structure

```
.
├── frontend/          # React frontend application
├── backend/          # Python backend application
└── README.md         # Project documentation
```

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   ```

3. Activate the virtual environment:
   - Windows:
     ```bash
     .\venv\Scripts\activate
     ```
   - Unix/MacOS:
     ```bash
     source venv/bin/activate
     ```

4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Run the backend server:
   ```bash
   python app.py
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

## Features

- Real-time chat interface
- Message history
- Responsive design
- Backend API for chat processing

## Technologies Used

- Frontend: React, TypeScript, Material-UI
- Backend: Python, FastAPI, WebSocket 