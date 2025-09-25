import mongoose from 'mongoose';

const tryOnResultSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    resultImageUrl: {
        type: String,
        required: true
    },
    cloudinaryPublicId: {
        type: String,
        required: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'product',
        default: null
    },
    productName: {
        type: String,
        default: null
    },
    productPrice: {
        type: Number,
        default: null
    },
    status: {
        type: String,
        enum: ['completed', 'failed'],
        default: 'completed'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const TryOnResult = mongoose.model('TryOnResult', tryOnResultSchema);

export default TryOnResult;