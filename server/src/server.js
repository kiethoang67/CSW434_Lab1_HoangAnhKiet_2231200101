
const { WebSocketServer, WebSocket } = require('ws');

const PORT = 8080;

const server = new WebSocketServer({
    host: '0.0.0.0',
    port: PORT,
});

function sendToClient(client, data) {
    if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
    }
}

function broadcast(data) {
    const message = JSON.stringify(data);

    server.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

server.on('connection', (socket) => {
    socket.username = 'Guest';

    console.log('A client connected.');

    sendToClient(socket, {
        type: 'system',
        message: 'Connected to chat server.',
        timestamp: new Date().toISOString(),
    });

    socket.on('message', (rawData) => {
        let data;

        try {
            data = JSON.parse(rawData.toString());
        } catch {
            sendToClient(socket, {
                type: 'error',
                message: 'Invalid JSON data.',
            });
            return;
        }

        if (data.type === 'user_join') {
            const username =
                typeof data.username === 'string'
                    ? data.username.trim()
                    : '';

            if (!username) {
                sendToClient(socket, {
                    type: 'error',
                    message: 'Username cannot be empty.',
                });
                return;
            }

            socket.username = username;

            console.log(`${username} joined the chat.`);

            broadcast({
                type: 'user_join',
                username,
                message: `${username} joined the chat.`,
                timestamp: new Date().toISOString(),
            });

            return;
        }

        if (data.type === 'chat_message') {
            const message =
                typeof data.message === 'string'
                    ? data.message.trim()
                    : '';

            if (!message) {
                return;
            }

            if (message.length > 2000) {
                sendToClient(socket, {
                    type: 'error',
                    message: 'Message is too long.',
                });
                return;
            }

            const chatMessage = {
                type: 'chat_message',
                username: socket.username,
                message,
                timestamp: new Date().toISOString(),
            };

            console.log(`${socket.username}: ${message}`);

            broadcast(chatMessage);

            return;
        }

        sendToClient(socket, {
            type: 'error',
            message: 'Unknown message type.',
        });
    });

    socket.on('close', () => {
        console.log(`${socket.username} disconnected.`);

        broadcast({
            type: 'user_leave',
            username: socket.username,
            message: `${socket.username} left the chat.`,
            timestamp: new Date().toISOString(),
        });
    });

    socket.on('error', (error) => {
        console.error('WebSocket client error:', error.message);
    });
});

server.on('listening', () => {
    console.log(`WebSocket server is running on port ${PORT}.`);
    console.log('Android Emulator URL: ws://10.0.2.2:8080');
});

server.on('error', (error) => {
    console.error('WebSocket server error:', error.message);
});
