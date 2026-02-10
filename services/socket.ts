
import { io, Socket } from 'socket.io-client';
import { getAuth } from './api';

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:80";

class SocketService {
  public socket: Socket | null = null;

  connect() {
    const { userId, authToken } = getAuth();
    if (!userId || !authToken) return;

    if (this.socket) return;

    this.socket = io(BACKEND_URL, {
      query: { userId, authToken },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  emit<T>(event: string, data: any, callback?: (response: T) => void) {
    if (this.socket) {
      this.socket.emit(event, data, callback);
    }
  }

  on(event: string, callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string) {
    if (this.socket) {
      this.socket.off(event);
    }
  }
}

export const socketService = new SocketService();
