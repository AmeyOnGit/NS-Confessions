import { create } from 'zustand';

interface WebSocketState {
  socket: WebSocket | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  sendMessage: (message: any) => void;
  onMessage: (callback: (data: any) => void) => void;
}

export const useWebSocket = create<WebSocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  
  connect: () => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const socket = new WebSocket(wsUrl);
    
    socket.onopen = () => {
      console.log('WebSocket connected');
      set({ socket, isConnected: true });
    };
    
    socket.onclose = () => {
      console.log('WebSocket disconnected');
      set({ socket: null, isConnected: false });
      
      // Attempt to reconnect after 3 seconds
      setTimeout(() => {
        const { isConnected } = get();
        if (!isConnected) {
          get().connect();
        }
      }, 3000);
    };
    
    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  },
  
  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.close();
      set({ socket: null, isConnected: false });
    }
  },
  
  sendMessage: (message: any) => {
    const { socket, isConnected } = get();
    if (socket && isConnected) {
      socket.send(JSON.stringify(message));
    }
  },
  
  onMessage: (callback: (data: any) => void) => {
    const { socket } = get();
    if (socket) {
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          callback(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
    }
  },
}));
