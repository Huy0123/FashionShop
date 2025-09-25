import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import { createServer } from 'http'
import { Server } from 'socket.io'
import connectDB from './config/mongodb.js'
import connectCloudinary from './config/cloudinary.js'
import userRouter from './routes/userRoute.js'
import productRouter from './routes/productRoute.js'
import cartRouter from './routes/cartRoute.js'
import orderRouter from './routes/orderRoute.js'
import chatRouter from './routes/chatRoute.js'
import tryOnRouter from './routes/tryOnRoute.js'
import { initializeChatHandlers } from './chat/chatHandler.js'
//config
const app = express()
const server = createServer(app)
const io = new Server(server, {
   cors: {
      origin: ["http://localhost:5173", "http://localhost:3000"],
      methods: ["GET", "POST"]
   }
})
const port = process.env.PORT || 4000
connectDB()
connectCloudinary()
//middlewares
app.use(cors())
app.use(express.json())
//api endpoints
app.use('/api/user', userRouter)
app.use('/api/product', productRouter)
app.use('/api/cart', cartRouter)
app.use('/api/order', orderRouter)
app.use('/api/chat', chatRouter)
app.use('/api/tryon', tryOnRouter)

app.get('/', (req, res) => {
   res.send("good api")
})
// Initialize chat handlers with Socket.IO
initializeChatHandlers(io);
server.listen(port, () => console.log('started server on port: ' + port))
