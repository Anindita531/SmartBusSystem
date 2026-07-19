// src/config/socket.js
let io

export const initSocket = (socketIO) => {
  io = socketIO
  console.log('✅ Socket.IO initialized')
}

export const getIO = () => {
  if (!io) {
    throw new Error('Socket not initialized!')
  }
  return io
}