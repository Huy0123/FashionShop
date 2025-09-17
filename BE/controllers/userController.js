import userModel from '../models/userModel.js';
import validator from 'validator';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const createToken = (id) => {
    return jwt.sign({ id }, process.env.jwt_key)
}
//người dùng đăng nhập
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (isValidPassword) {
            const token = createToken(user._id);
            res.json({ success: true, message: "Login successful", token });

        } else {
            return res.json({ success: false, message: "Invalid password" });
        }

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Internal server error" });
    }

}

//người dùng đăng ký
const registerUser = async (req, res) => {
    try {
        const { name, email, password, comfirm_password } = req.body;

        //ktra xem người dùng có tồn tại hay không
        const exists = await userModel.findOne({ email });
        if (exists) {
            return res.json({ success: false, message: "User already exist!!" })
        }

        //ktra xem email có hợp lệ và mật khẩu có mạnh hay không
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Invalid email" })
        }
        if (password.length < 8) {
            return res.json({ success: false, message: "Enter password stronger" })
        }
        //ktra mật khẩu nhập lại có khớp không
        if (password !== comfirm_password) {
            return res.json({ success: false, message: "Password do not match!" });
        }

        //mã hóa mật khẩu trc khi lưu vào csdl
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = new userModel({
            name,
            email,
            password: hashedPassword
        })

        const user = await newUser.save()

        const token = createToken(user._id)
        res.json({ success: true, message: "Account created successfully", token })

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}

//admin đăng nhập
const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (email === process.env.admin_email && password === process.env.admin_password) {
            const token = jwt.sign(email + password, process.env.jwt_key);
            return res.json({ success: true, message: "Admin login successfully", token })
        } else {
            return res.json({ success: false, message: "Invalid email or password" })
        }
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

//lấy thông tin user profile
const getUserProfile = async (req, res) => {
    try {
        const userId = req.body.userId;
        const user = await userModel.findById(userId).select('-password');
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }
        res.json({ success: true, user });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

const updateUserProfile = async (req, res) => {
    try {
        const userId = req.body.userId;
        const { name, email } = req.body;
        const user = await userModel.findByIdAndUpdate(userId, { name, email }, { new: true }).select('-password');
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }
        res.json({ success: true, user });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

export { loginUser, registerUser, adminLogin, getUserProfile, updateUserProfile };