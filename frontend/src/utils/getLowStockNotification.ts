"use client";
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

let socket: any;

const useSocket = () => {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const socketServerUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || "http://localhost:3000";
    socket = io(socketServerUrl, {
      transports: ['websocket'],
      withCredentials: true,
    });

    socket.on('low-stock-alert', (data: any) => {
      if (data && data.status === false && data.message === "No items are low in stock.") {
        setNotifications([]); 
        return;
      }

      const flatData = Array.isArray(data) ? data.flat() : [data];

      setNotifications(flatData); 
    });

    return () => {
      socket.off('low-stock-alert');
      socket.disconnect();
    };
  }, []); 

  return { notifications };
};

export default useSocket;
