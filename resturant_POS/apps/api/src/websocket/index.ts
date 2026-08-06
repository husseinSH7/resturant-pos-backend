import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

let io: SocketIOServer;

export const initializeWebSocket = (server: HTTPServer) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join-restaurant', (restaurantId: string) => {
      socket.join(`restaurant-${restaurantId}`);
      console.log(`Socket ${socket.id} joined restaurant ${restaurantId}`);
    });

    socket.on('leave-restaurant', (restaurantId: string) => {
      socket.leave(`restaurant-${restaurantId}`);
      console.log(`Socket ${socket.id} left restaurant ${restaurantId}`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
};

export const broadcastToRestaurant = (restaurantId: string, event: string, data: any) => {
  if (io) {
    io.to(`restaurant-${restaurantId}`).emit(event, data);
  }
};

export const getIO = () => io;