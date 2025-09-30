import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
    roomId: { type: String, required: true },
    senderId: { type: String, required: true },
    senderName: { type: String, required: true },
    senderType: { type: String, enum: ['user', 'admin', 'ai'], required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
});
const chatModel = mongoose.models.chat || mongoose.model('chat', chatSchema);
export default chatModel;
