from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from typing import List
import json
from datetime import datetime

app = FastAPI()

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[dict] = []

    async def connect(self, websocket: WebSocket, username: str):
        await websocket.accept()
        self.active_connections.append({
            "websocket": websocket,
            "username": username
        })
        # Notify everyone that a new user joined
        await self.broadcast({
            "type": "system",
            "message": f"{username} joined the chat",
            "timestamp": datetime.now().strftime("%H:%M:%S"),
            "users_count": len(self.active_connections)
        })

    def disconnect(self, websocket: WebSocket):
        connection = next((conn for conn in self.active_connections if conn["websocket"] == websocket), None)
        if connection:
            username = connection["username"]
            self.active_connections.remove(connection)
            return username
        return None

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            await connection["websocket"].send_json(message)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    def get_usernames(self):
        return [conn["username"] for conn in self.active_connections]


manager = ConnectionManager()


@app.get("/")
async def get():
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>FastAPI Chatroom</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                height: 100vh;
                display: flex;
                justify-content: center;
                align-items: center;
            }
            .container {
                background: white;
                border-radius: 10px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                width: 90%;
                max-width: 800px;
                height: 600px;
                display: flex;
                flex-direction: column;
            }
            .header {
                background: #667eea;
                color: white;
                padding: 20px;
                border-radius: 10px 10px 0 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .header h1 {
                font-size: 24px;
            }
            .users-count {
                background: rgba(255,255,255,0.2);
                padding: 5px 15px;
                border-radius: 20px;
                font-size: 14px;
            }
            #login-screen {
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                height: 100%;
                padding: 40px;
            }
            #login-screen h2 {
                margin-bottom: 20px;
                color: #333;
            }
            #username {
                width: 100%;
                max-width: 300px;
                padding: 12px;
                border: 2px solid #ddd;
                border-radius: 5px;
                font-size: 16px;
                margin-bottom: 15px;
            }
            #join-btn {
                width: 100%;
                max-width: 300px;
                padding: 12px;
                background: #667eea;
                color: white;
                border: none;
                border-radius: 5px;
                font-size: 16px;
                cursor: pointer;
                transition: background 0.3s;
            }
            #join-btn:hover {
                background: #5568d3;
            }
            #chat-screen {
                display: none;
                flex-direction: column;
                flex: 1;
                overflow: hidden;
            }
            #messages {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
                background: #f8f9fa;
            }
            .message {
                margin-bottom: 15px;
                animation: slideIn 0.3s ease;
            }
            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            .message-user {
                background: #e3f2fd;
                padding: 10px 15px;
                border-radius: 10px;
                border-left: 4px solid #667eea;
            }
            .message-system {
                background: #fff3cd;
                padding: 10px 15px;
                border-radius: 10px;
                text-align: center;
                font-style: italic;
                color: #856404;
            }
            .message-header {
                display: flex;
                justify-content: space-between;
                margin-bottom: 5px;
            }
            .username {
                font-weight: bold;
                color: #667eea;
            }
            .timestamp {
                font-size: 12px;
                color: #999;
            }
            .message-text {
                color: #333;
            }
            .input-area {
                display: flex;
                padding: 20px;
                background: white;
                border-top: 1px solid #ddd;
            }
            #messageText {
                flex: 1;
                padding: 12px;
                border: 2px solid #ddd;
                border-radius: 5px;
                font-size: 14px;
                resize: none;
            }
            #sendBtn {
                margin-left: 10px;
                padding: 12px 30px;
                background: #667eea;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                transition: background 0.3s;
            }
            #sendBtn:hover {
                background: #5568d3;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>💬 FastAPI Chatroom</h1>
                <div class="users-count" id="usersCount">0 users online</div>
            </div>
            
            <div id="login-screen">
                <h2>Welcome to the Chatroom!</h2>
                <input type="text" id="username" placeholder="Enter your username" maxlength="20" />
                <button id="join-btn">Join Chat</button>
            </div>

            <div id="chat-screen">
                <div id="messages"></div>
                <div class="input-area">
                    <textarea id="messageText" placeholder="Type your message..." rows="2"></textarea>
                    <button id="sendBtn">Send</button>
                </div>
            </div>
        </div>

        <script>
            let ws = null;
            let currentUsername = "";

            const loginScreen = document.getElementById("login-screen");
            const chatScreen = document.getElementById("chat-screen");
            const usernameInput = document.getElementById("username");
            const joinBtn = document.getElementById("join-btn");
            const messagesDiv = document.getElementById("messages");
            const messageText = document.getElementById("messageText");
            const sendBtn = document.getElementById("sendBtn");
            const usersCount = document.getElementById("usersCount");

            joinBtn.onclick = function() {
                const username = usernameInput.value.trim();
                if (username) {
                    currentUsername = username;
                    connectWebSocket();
                    loginScreen.style.display = "none";
                    chatScreen.style.display = "flex";
                } else {
                    alert("Please enter a username!");
                }
            };

            usernameInput.addEventListener("keypress", function(event) {
                if (event.key === "Enter") {
                    joinBtn.click();
                }
            });

            function connectWebSocket() {
                ws = new WebSocket(`ws://localhost:8000/ws/${currentUsername}`);
                
                ws.onmessage = function(event) {
                    const data = JSON.parse(event.data);
                    
                    if (data.users_count !== undefined) {
                        usersCount.textContent = `${data.users_count} user${data.users_count !== 1 ? 's' : ''} online`;
                    }
                    
                    if (data.type === "system") {
                        addSystemMessage(data.message, data.timestamp);
                    } else {
                        addMessage(data.username, data.message, data.timestamp);
                    }
                };

                ws.onclose = function() {
                    addSystemMessage("Disconnected from server", new Date().toLocaleTimeString());
                };

                ws.onerror = function() {
                    addSystemMessage("Connection error", new Date().toLocaleTimeString());
                };
            }

            function addMessage(username, message, timestamp) {
                const messageDiv = document.createElement("div");
                messageDiv.className = "message message-user";
                messageDiv.innerHTML = `
                    <div class="message-header">
                        <span class="username">${username}</span>
                        <span class="timestamp">${timestamp}</span>
                    </div>
                    <div class="message-text">${escapeHtml(message)}</div>
                `;
                messagesDiv.appendChild(messageDiv);
                messagesDiv.scrollTop = messagesDiv.scrollHeight;
            }

            function addSystemMessage(message, timestamp) {
                const messageDiv = document.createElement("div");
                messageDiv.className = "message message-system";
                messageDiv.innerHTML = `${message} <span class="timestamp">${timestamp}</span>`;
                messagesDiv.appendChild(messageDiv);
                messagesDiv.scrollTop = messagesDiv.scrollHeight;
            }

            function escapeHtml(text) {
                const div = document.createElement('div');
                div.textContent = text;
                return div.innerHTML;
            }

            sendBtn.onclick = sendMessage;
            messageText.addEventListener("keypress", function(event) {
                if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    sendMessage();
                }
            });

            function sendMessage() {
                const message = messageText.value.trim();
                if (message && ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(message);
                    messageText.value = "";
                }
            }
        </script>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)


@app.websocket("/ws/{username}")
async def websocket_endpoint(websocket: WebSocket, username: str):
    await manager.connect(websocket, username)
    try:
        while True:
            data = await websocket.receive_text()
            message = {
                "type": "message",
                "username": username,
                "message": data,
                "timestamp": datetime.now().strftime("%H:%M:%S"),
                "users_count": len(manager.active_connections)
            }
            await manager.broadcast(message)
    except WebSocketDisconnect:
        disconnected_user = manager.disconnect(websocket)
        if disconnected_user:
            await manager.broadcast({
                "type": "system",
                "message": f"{disconnected_user} left the chat",
                "timestamp": datetime.now().strftime("%H:%M:%S"),
                "users_count": len(manager.active_connections)
            })


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)