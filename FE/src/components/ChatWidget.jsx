import React, { useState, useEffect, useRef, useContext } from 'react';
import { ChatContext } from '../context/ChatContext';
import { ShopContext } from '../context/ShopContext';

const ChatWidget = () => {
    const {
        messages,
        sendMessage,
        isTyping,
        isChatOpen,
        openChat,
        closeChat,
        unreadCount,
        isAdminOnline
    } = useContext(ChatContext);

    const { token, userData } = useContext(ShopContext);
    const [newMessage, setNewMessage] = useState('');
    const [isMinimized, setIsMinimized] = useState(false);
    const messagesEndRef = useRef(null);

    // Debug log để kiểm tra isAdminOnline
    useEffect(() => {
        console.log('ChatWidget - isAdminOnline changed:', isAdminOnline);
    }, [isAdminOnline]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Auto scroll when typing status changes
    useEffect(() => {
        if (isTyping) {
            setTimeout(() => {
                scrollToBottom();
            }, 100); // Small delay to ensure typing indicator is rendered
        }
    }, [isTyping]);

    // Auto scroll when chat opens
    useEffect(() => {
        if (isChatOpen) {
            setTimeout(() => {
                scrollToBottom();
            }, 100); // Small delay to ensure DOM is rendered
        }
    }, [isChatOpen]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (newMessage.trim() && token) {
            sendMessage(newMessage);
            setNewMessage('');
        }
    };

    // Helper function to render message content with images
    const renderMessageContent = (message) => {
        const text = message.message;

        // Helper function to highlight @ai tags
        const highlightAiTags = (text) => {
            return text.replace(/@ai/gi, '<span class="bg-purple-100 text-purple-700 px-1 rounded font-semibold">@ai</span>');
        };

        // Helper function to convert Markdown links to clickable HTML links
        const convertMarkdownLinks = (text) => {
            // Convert [**text**](/url) to <a href="/url"><strong>text</strong></a>
            // This handles both [**XEM SẢN PHẨM**](/product/123) and [text](/url) formats
            return text.replace(/\[\*\*(.*?)\*\*\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer transition-colors"><strong>$1</strong></a>')
                      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:text-blue-800 font-semibold underline cursor-pointer transition-colors">$1</a>');
        };

        // Process text: highlight @ai tags first, then convert markdown links
        const processedText = convertMarkdownLinks(highlightAiTags(text));

        return (
            <div>
                {/* Render text content with highlighted @ai tags and clickable links */}
                <span
                    className="whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: processedText }}
                />

                {/* Render separate image if AI sent one */}
                {message.image && (
                    <div className="mt-3">
                        <img
                            src={message.image}
                            alt="Product"
                            className="w-full max-w-xs rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                            onClick={() => window.open(message.image, '_blank')}
                            onError={(e) => {
                                console.error('Failed to load image:', message.image);
                                e.target.style.display = 'none';
                            }}
                        />
                    </div>
                )}
            </div>
        );
    };

    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!token || !userData) {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 z-50">
            {/* Floating Chat Button */}
            {!isChatOpen && (
                <div className="relative">
                    <button
                        onClick={openChat}
                        className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-full p-4 shadow-lg transition-all duration-300 transform hover:scale-110 animate-pulse"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        {unreadCount > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center animate-bounce">
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    {/* Welcome Message Bubble */}
                    <div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-lg p-3 max-w-lg animate-bounce">
                        <div className="text-sm text-gray-700">
                           Hi {userData?.name}👋
                        </div>
                        <div className="absolute bottom-0 right-4 transform translate-y-1/2 rotate-45 w-2 h-2 bg-white"></div>
                    </div>
                </div>
            )}

            {/* Chat Window */}
            {isChatOpen && (
                <div className={`bg-white rounded-lg shadow-2xl w-80 ${isMinimized ? 'h-14' : 'h-[500px]'} flex flex-col border transition-all duration-300 transform`}>
                    {/* Chat Header */}
                    <div className={`${isAdminOnline ? 'bg-gradient-to-r from-[#112D60] to-[#798184]' : 'bg-gradient-to-r from-[#FF3E9D] to-[#EF88BB]'} text-white p-4 rounded-t-lg flex justify-between items-center transition-all duration-300`}>
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md">
                                <span className="text-lg">{isAdminOnline ? '👩‍💼' : '🤖'}</span>
                            </div>
                            <div>
                                <h3 className="font-semibold">{isAdminOnline ? 'Chevai⚡' : 'Ai-chan✨'}</h3>
                                <p className="text-xs opacity-90 flex items-center">
                                    <span className={`w-2 h-2 ${isAdminOnline ? 'bg-green-300 shadow-green-400 shadow-lg' : 'bg-yellow-300 shadow-yellow-400 shadow-md'} rounded-full mr-2 animate-pulse`}></span>
                                    <span className="font-medium">{isAdminOnline ?'Đang hoạt động' : 'Trợ lý AI'}</span>

                                </p>
                            </div>
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setIsMinimized(!isMinimized)}
                                className="text-white hover:text-gray-200 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            <button
                                onClick={closeChat}
                                className="text-white hover:text-gray-200 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {!isMinimized && (
                        <>
                            {/* Messages Container */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-purple-50 to-pink-50">
                                {/* Welcome message - always show */}
                                <div className="text-center space-y-4 pb-4 border-b border-purple-200">
                                    <div className="text-4xl animate-bounce">💖💖💖</div>
                                    <div className="text-gray-600 text-sm">
                                        <p className="font-semibold text-purple-600">Chào  {userData?.name}!🌟</p>
                                        {isAdminOnline ? (
                                            <>
                                                <p >
                                                    💼 Shop đang hoạt động đó hãy hỏi shop để được tư vấn tốt hơn nha!!
                                                </p>
                                                <p>
                                                    Hoặc bạn có thể tag <span className="bg-purple-100 px-1 rounded font-mono text-purple-700">@ai</span>để gọi trợ lý của shop mình ạ!
                                                </p>
                                            </>
                                        ) : (
                                            <>
                                                <p>Mình là Ai-chan, trợ lý thời trang của Chevai</p>
                                                <p className="text-xs mt-2 text-gray-500">
                                                    🤖 Mình sẵn sàng hỗ trợ bạn. Bạn muốn có trang phục mới nào cho tủ đồ của bạn nè
                                                </p>

                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Messages */}
                                {messages.map((message, index) => (
                                    <div
                                        key={index}
                                        className={`flex ${message.senderType === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                                    >
                                        <div
                                            className={`max-w-xs px-4 py-3 rounded-2xl text-sm shadow-md transform transition-all duration-200 hover:scale-105 ${message.senderType === 'user'
                                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-br-sm'
                                                : message.senderType === 'ai'
                                                    ? 'bg-gradient-to-r from-green-100 to-blue-100 text-gray-800 border-l-4 border-green-400 rounded-bl-sm'
                                                    : 'bg-gradient-to-r from-blue-100 to-purple-100 text-gray-800 border-l-4 border-blue-400 rounded-bl-sm'
                                                }`}
                                        >
                                            {message.senderType !== 'user' && (
                                                <div className="flex items-center mb-1">
                                                    <span className="text-xs font-semibold text-purple-600">
                                                        {message.senderType === 'ai' ? '🤖 Ai-chan' : '👩‍💼 Admin'}
                                                    </span>
                                                </div>
                                            )}
                                            {renderMessageContent(message)}
                                            <p className={`text-xs mt-2 ${message.senderType === 'user'
                                                ? 'text-purple-100'
                                                : 'text-gray-500'
                                                }`}>
                                                {formatTime(message.timestamp)}
                                            </p>
                                        </div>
                                    </div>
                                ))}

                                {isTyping && (
                                    <div className="flex justify-start animate-fade-in">
                                        <div className={`px-4 py-3 rounded-2xl rounded-bl-sm shadow-md ${isAdminOnline ? 'bg-green-50 border border-green-200' : 'bg-gray-100'}`}>
                                            <div className="flex items-center space-x-1">
                                                <span className={`text-xs font-semibold ${isAdminOnline ? 'text-green-600' : 'text-purple-600'}`}>
                                                    {isAdminOnline ? ' đang trả lời' : ' đang trả lời'}
                                                </span>
                                            </div>
                                            <div className="flex space-x-1 mt-1">
                                                <div className={`w-2 h-2 ${isAdminOnline ? 'bg-green-400' : 'bg-purple-400'} rounded-full animate-bounce`}></div>
                                                <div className={`w-2 h-2 ${isAdminOnline ? 'bg-blue-400' : 'bg-pink-400'} rounded-full animate-bounce delay-100`}></div>
                                                <div className={`w-2 h-2 ${isAdminOnline ? 'bg-green-500' : 'bg-blue-400'} rounded-full animate-bounce delay-200`}></div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>

                            {/* Message Input */}
                            <form onSubmit={handleSendMessage} className="p-4 border-t bg-white">
                                <div className="flex space-x-3">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder={isAdminOnline ? "Nhắn tin hoặc @ai để gọi AI..." : "Nhắn tin"}
                                        className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 text-sm transition-all duration-200"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim()}
                                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-300 disabled:to-gray-300 text-white rounded-full px-4 py-2 transition-all duration-200 transform hover:scale-105 disabled:scale-100"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                        </svg>
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default ChatWidget;
