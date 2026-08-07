import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma.js';

const JWT_SECRET = process.env.JWT_SECRET!;

let io: SocketIOServer;

export const initializeWebSocket = (server: HTTPServer) => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(",") 
    : ["http://localhost:3000", "http://localhost:19006", "exp://192.168.*:*"];

  io = new SocketIOServer(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.some(allowed => origin.includes(allowed.replace("*", "")))) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      methods: ['GET', 'POST'],
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        restaurantId: string;
        role: string;
      };

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, restaurantId: true, role: true, isActive: true },
      });

      if (!user || !user.isActive) {
        return next(new Error('Authentication error: User not found or inactive'));
      }

      if (user.restaurantId !== decoded.restaurantId) {
        return next(new Error('Authentication error: Restaurant mismatch'));
      }

      socket.data.userId = user.id;
      socket.data.restaurantId = user.restaurantId;
      socket.data.role = user.role;

      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id, 'restaurantId:', socket.data.restaurantId);

    socket.on('join-restaurant', (restaurantId: string) => {
      if (socket.data.restaurantId !== restaurantId) {
        socket.emit('error', { message: 'Cannot join different restaurant' });
        return;
      }
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