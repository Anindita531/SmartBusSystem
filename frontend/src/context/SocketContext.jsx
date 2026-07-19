import { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'

const SocketContext = createContext(null)

export const useSocket = () => useContext(SocketContext)

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)

  useEffect(() => {
    const newSocket = io('http://localhost:5000', {
      withCredentials: true
    })

    newSocket.on('connect', () => {
      console.log('Socket connected')
    })

    setSocket(newSocket)

    return () => newSocket.close()
  }, [])

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  )
}