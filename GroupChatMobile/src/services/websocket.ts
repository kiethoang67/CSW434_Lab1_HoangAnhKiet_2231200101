
import { WS_URL } from '../config';

export type ChatEvent = {
    type: string;
    username?: string;
    message?: string;
    timestamp?: string;
};

type MessageListener = (event: ChatEvent) => void;

let socket: WebSocket | null = null;
const listeners = new Set<MessageListener>();

function notifyListeners(event: ChatEvent) {
    listeners.forEach((listener) => listener(event));
}

export function addMessageListener(listener: MessageListener) {
    listeners.add(listener);

    return () => {
        listeners.delete(listener);
    };
}

export function connectWebSocket(username: string): Promise<void> {
    return new Promise((resolve, reject) => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            resolve();
            return;
        }

        socket = new WebSocket(WS_URL);

        let opened = false;

        socket.onopen = () => {
            opened = true;

            socket?.send(
                JSON.stringify({
                    type: 'user_join',
                    username,
                }),
            );

            resolve();
        };

        socket.onmessage = (event) => {
            try {
                const data: ChatEvent = JSON.parse(event.data);
                notifyListeners(data);
            } catch {
                notifyListeners({
                    type: 'error',
                    message: 'Cannot read server message.',
                });
            }
        };

        socket.onerror = () => {
            if (!opened) {
                reject(new Error('Cannot connect to WebSocket server.'));
            }
        };

        socket.onclose = () => {
            socket = null;

            notifyListeners({
                type: 'connection_closed',
                message: 'Disconnected from server.',
            });

            if (!opened) {
                reject(new Error('WebSocket connection closed.'));
            }
        };
    });
}

export function sendChatMessage(message: string): boolean {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        return false;
    }

    socket.send(
        JSON.stringify({
            type: 'chat_message',
            message,
        }),
    );

    return true;
}

export function disconnectWebSocket() {
    if (socket) {
        socket.close();
        socket = null;
    }
}
