import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();

  connect(userId: string) {
    if (this.socket?.connected) return;

    this.socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8000', {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected');
      this.socket?.emit('register', userId);
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });

    this.socket.on('message', (data) => {
      this.emit('message', data);
    });

    this.socket.on('newMessage', (data) => {
      this.emit('newMessage', data);
    });

    this.socket.on('typing', (data) => {
      this.emit('typing', data);
    });

    this.socket.on('messagesRead', (data) => {
      this.emit('messagesRead', data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinChat(chatId: string, userId: string) {
    this.socket?.emit('join', { chatId, userId });
  }

  sendMessage(data: {
    chatId: string;
    senderId: string;
    receiverId: string;
    message: string;
  }) {
    this.socket?.emit('sendMessage', data);
  }

  sendTyping(data: {
    chatId: string;
    userId: string;
    isTyping: boolean;
  }) {
    this.socket?.emit('typing', data);
  }

  markAsRead(data: {
    chatId: string;
    userId: string;
  }) {
    this.socket?.emit('markAsRead', data);
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  isConnected() {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();