import TryOnResult from '../models/tryOnModel.js';
import { v2 as cloudinary } from 'cloudinary';
import fetch from 'node-fetch';

// Lấy danh sách try-on results của user
const getUserTryOnResults = async (req, res) => {
    try {
        const userId = req.body.userId;

        const results = await TryOnResult.find({ userId })
            .sort({ createdAt: -1 })
            .limit(20);

        res.json({
            success: true,
            data: results
        });

    } catch (error) {
        console.error('Error fetching try-on results:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách try-on: ' + error.message
        });
    }
};

// Xóa try-on result
const deleteTryOnResult = async (req, res) => {
    try {
        const { resultId } = req.params;
        const userId = req.body.userId;

        console.log('Delete request:', {
            resultId,
            userId,
            requestUserId: req.body.requestUserId,
            authUserId: req.body.userId,
            userIdType: typeof userId
        });

        const result = await TryOnResult.findById(resultId);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy kết quả try-on'
            });
        }

        if (result.userId.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền xóa kết quả này'
            });
        }

        try {
            await cloudinary.uploader.destroy(result.cloudinaryPublicId);
            console.log(`Deleted image from Cloudinary: ${result.cloudinaryPublicId}`);
        } catch (cloudinaryError) {
            console.error('Error deleting from Cloudinary:', cloudinaryError);
        }
        await TryOnResult.findByIdAndDelete(resultId);

        res.json({
            success: true,
            message: 'Đã xóa kết quả try-on thành công'
        });

    } catch (error) {
        console.error('Error deleting try-on result:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa kết quả try-on: ' + error.message
        });
    }
};

const uploadTryOnResultToCloudinary = async (imageUrl, userId, productInfo = {}) => {
    try {
        // Download ảnh từ URL
        const response = await fetch(imageUrl);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload lên Cloudinary
        const uploadResult = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {
                    folder: 'try-on-results',
                    resource_type: 'image',
                    format: 'jpg',
                    quality: 'auto',
                    fetch_format: 'auto'
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            ).end(buffer);
        });

        // Lưu vào database
        const tryOnResult = new TryOnResult({
            userId: userId,
            resultImageUrl: uploadResult.secure_url,
            cloudinaryPublicId: uploadResult.public_id,
            productId: productInfo.productId || null,
            productName: productInfo.productName || null,
            productPrice: productInfo.productPrice || null,
            status: 'completed'
        });

        await tryOnResult.save();

        return {
            success: true,
            data: {
                id: tryOnResult._id,
                imageUrl: uploadResult.secure_url,
                publicId: uploadResult.public_id
            }
        };

    } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

export {
    getUserTryOnResults,
    deleteTryOnResult,
    uploadTryOnResultToCloudinary
};