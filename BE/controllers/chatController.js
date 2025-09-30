import chatModel from "../models/chatModel.js";

// Lấy lịch sử chat theo roomId
const getChatHistory = async (req, res) => {
    try {
        const { roomId } = req.params;
        const messages = await chatModel.find({ roomId }).sort({ timestamp: 1 });
        res.json({ success: true, messages });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Lưu tin nhắn mới
const saveMessage = async (req, res) => {
    try {
        const { roomId, senderId, senderName, senderType, message } = req.body;

        const newMessage = new chatModel({
            roomId,
            senderId,
            senderName,
            senderType,
            message
        });

        await newMessage.save();
        res.json({ success: true, message: "Message saved successfully" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Lấy danh sách rooms cho admin
const getChatRooms = async (req, res) => {
    try {
        const rooms = await chatModel.aggregate([
            {
                $group: {
                    _id: "$roomId",
                    lastMessage: { $last: "$message" },
                    lastMessageTime: { $last: "$timestamp" },
                    senderName: { $last: "$senderName" },
                    unreadCount: {
                        $sum: {
                            $cond: [
                                { $and: [{ $eq: ["$senderType", "user"] }, { $eq: ["$isRead", false] }] },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            { $sort: { lastMessageTime: -1 } }
        ]);

        res.json({ success: true, rooms });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Xóa đoạn chat
const deleteChatRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        await chatModel.deleteMany({ roomId });
        res.json({ success: true, message: "Chat room deleted successfully" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};


export { getChatHistory, saveMessage, getChatRooms, deleteChatRoom };
