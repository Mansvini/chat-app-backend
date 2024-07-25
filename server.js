import { createServer } from 'http';
import { Server } from 'socket.io';
import { schedule } from 'node-cron';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import winston from 'winston';
import expressWinston from 'express-winston';

config();

const originURL = process.env.NODE_ENV === 'production' ? process.env.PUBLIC_FRONTEND_URL : process.env.LOCAL_FRONTEND_URL;

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: originURL,
  },
});

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Security Middleware
app.use(helmet());

// Compression Middleware
app.use(compression());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Logging Middleware
app.use(expressWinston.logger({
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logfile.log' })
  ],
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.json()
  )
}));

app.use(express.json());

app.set('trust proxy', 1);

const users = {};

const addUserSocket = (userId, socketId) => {
  if (!users[userId]) {
    users[userId] = {sockets: []};
  }
  if (!users[userId].sockets.includes(socketId)) {
    users[userId].sockets.push(socketId);
  }
};

const removeUserSocket = (userId, socketId) => {
  if (users[userId]) {
    users[userId].sockets = users[userId].sockets.filter(id => id !== socketId);
    if (users[userId].sockets.length === 0) {
      delete users[userId];
    }
  }
};

const getSocketIdsByUserId = (userId) => {
  return users[userId]?.sockets || [];
};

io.use((socket, next) => {
  const {userId} = socket.handshake.auth;
  if (!userId) {
    return next(new Error("invalid user"));
  }
  socket.userId = userId;
  next();
});

io.on('connection', (socket) => {
  addUserSocket(socket.userId, socket.id);
  
  const joinedRandomChatHandler = async (waitingUserId, chatSessionId) => {
    const waitingSocketIds = getSocketIdsByUserId(waitingUserId);
    io.to(waitingSocketIds).emit('strangerConnected', chatSessionId);
  };

  const sendMessageHandler = ({message, recepientId}) => {
    const recepientSocketIds = getSocketIdsByUserId(recepientId);
    io.to(recepientSocketIds).emit('receiveMessage', message);
  };

  const typingHandler = (chatSessionId, senderId, recepientId) => {
    const recipientSocketIds = getSocketIdsByUserId(recepientId);
    const senderSocketIds = getSocketIdsByUserId(senderId);
    const socketIds = [...recipientSocketIds, ...senderSocketIds];
    io.to(socketIds).emit('userTyping', senderId, chatSessionId );
  };

  const stopTypingHandler = (chatSessionId, senderId, recepientId) => {
    const recipientSocketIds = getSocketIdsByUserId(recepientId);
    const senderSocketIds = getSocketIdsByUserId(senderId);
    const socketIds = [...recipientSocketIds, ...senderSocketIds];
    io.to(socketIds).emit('userStoppedTyping', senderId, chatSessionId);
  };

  const disconnectHandler = () => {
    removeUserSocket(socket.userId, socket.id)

    socket.off('joinedRandomChat', joinedRandomChatHandler);
    socket.off('sendMessage', sendMessageHandler);
    socket.off('typing', typingHandler);
    socket.off('stopTyping', stopTypingHandler);
    socket.off('disconnect', disconnectHandler);
  };

  socket.on('joinedRandomChat', joinedRandomChatHandler);
  socket.on('sendMessage', sendMessageHandler);
  socket.on('typing', typingHandler);
  socket.on('stopTyping', stopTypingHandler);
  socket.on('disconnect', disconnectHandler);
});

// API- run cron job to delete messages older than 24 hours
app.get('/api/run-cron-job', async (req, res) => {
  console.log('Running scheduled task to delete old messages');
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  console.log('Deleting messages older than:', twentyFourHoursAgo);
  const { data, error } = await supabase
    .from('messages')
    .delete()
    .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  if (error) {
    console.error('Error deleting old messages:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete messages' });
  } else {
    console.log('Old messages deleted successfully', data);
    return res.status(200).json({ success: true, message: 'Successfully deleted old messages' });
  }
});

server.listen(process.env.BACKEND_PORT || 3001, (err) => {
  if (err) throw err;
  console.log(`> Server ready on${process.env.BACKEND_PORT || 3001}`);
});