
import { createContext, useState, useEffect, useContext } from "react";
import { io } from "socket.io-client";
import { ShopContext } from "./ShopContext";

export const ChatContext = createContext();

const ChatContextProvider = (props) => {
    const [socket, setSocket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isAdminOnline, setIsAdminOnline] = useState(false);
    const { token, userData } = useContext(ShopContext);
    const backendUrl = import.meta.env.VITE_BE_URL || 'http://localhost:4000';

    // Load chat history when user logs in
    const loadChatHistory = async () => {
        if (token && userData) {
            try {
                const roomId = `user_${userData._id}`;
                const response = await fetch(`${backendUrl}/api/chat/history/${roomId}`, {
                    headers: { token }
                });
                const data = await response.json();
                if (data.success) {
                    setMessages(data.messages);
                }
            } catch (error) {
                console.log('Error loading chat history:', error);
            }
        }
    };

    useEffect(() => {
        if (token && userData) {
            loadChatHistory();
            const newSocket = io(backendUrl);
            setSocket(newSocket);
            const roomId = `user_${userData._id}`;
            newSocket.emit('join_room', roomId);

            newSocket.emit('check_admin_status');
            // Listen for incoming messages
            const handleIncomingMessage = (message) => {
                const userRoomId = `user_${userData._id}`;
                // Chỉ nhận message đúng room
                if (message.roomId && message.roomId !== userRoomId) return;
                setMessages(prev => {
                    // Loại bỏ tin nhắn temp trùng
                    const filtered = prev.filter(msg => !(msg.isTemp && msg.message === message.message && msg.senderType === message.senderType));
                    // Kiểm tra message đã tồn tại
                    const exists = filtered.some(msg => msg._id === message._id);
                    if (!exists) return [...filtered, message];
                    return filtered;
                });

                if (!isChatOpen && message.senderType !== 'user') {
                    setUnreadCount(prev => prev + 1);
                }
            };
            newSocket.on('receive_message', handleIncomingMessage);
            newSocket.on('new_message_global', handleIncomingMessage);

            // Typing cho admin và ai
            const handleTyping = (isTyping) => setIsTyping(isTyping);
            newSocket.on('admin_typing', (data) => handleTyping(data.isTyping));
            newSocket.on('typing', (data) => {
                if (data.userId === 'ai') {
                    handleTyping(true);
                }
            });

            newSocket.on('stop_typing', (data) => {
                if (data.userId === 'ai') {
                    handleTyping(false);
                }
            });

            // Listen for admin status updates 
            const handleAdminStatus = (isOnline) => setIsAdminOnline(isOnline);

            newSocket.on('admin_status', (data) => handleAdminStatus(data.isAdminOnline));
            newSocket.on('admin_status_changed', (data) => handleAdminStatus(data.isOnline));
            newSocket.on('adminStatus', (data) => handleAdminStatus(data.online));
            // Listen for message errors
            newSocket.on('message_error', (data) => console.error('Message error:', data.error));
            return () => newSocket.close();

        }
    }, [token, userData, backendUrl]);

    const sendMessage = (message) => {
        if (socket && userData) {
            const roomId = `user_${userData._id}`;
            const messageData = {
                roomId,
                senderId: userData._id,
                senderName: userData.name,
                senderType: 'user',
                message
            };
            // Add message to UI immediately for instant feedback
            const tempMessage = {
                ...messageData,
                _id: 'temp-' + Date.now(),
                timestamp: new Date(),
                isTemp: true
            };

            setMessages(prevMessages => [...prevMessages, tempMessage]);
            socket.emit('send_message', messageData);
            console.log('User sent message:', messageData);
        }
    };

    const openChat = () => {
        setIsChatOpen(true);
        setUnreadCount(0);
    };

    const closeChat = () => {
        setIsChatOpen(false);
    };

    const value = {
        messages,
        sendMessage,
        isTyping,
        isChatOpen,
        openChat,
        closeChat,
        unreadCount,
        isAdminOnline
    };

    return (
        <ChatContext.Provider value={value}>
            {props.children}
        </ChatContext.Provider>
    );
};

export default ChatContextProvider;
