import express from 'express'
import mongoose from 'mongoose'
import 'dotenv/config'

import cors from 'cors'
import cookieParser from 'cookie-parser'

import authRoutes from './routes/authRoutes.js'
import productRoutes from './routes/productRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import cartRoutes from './routes/cartRoutes.js'
import addressRoutes from './routes/addressRoutes.js'
import orderRoutes from './routes/orderRoutes.js'

const app = express()
const PORT = process.env.PORT
const MONGODB_URL = process.env.MONGODB_URL

app.use(express.json())
app.use(cors({
    origin: ["http://localhost:5173"],
    credentials: true
})) 
app.use(cookieParser())

mongoose.connect(MONGODB_URL).then(()=>console.log('Connected to database'))

app.get('/' , (req , res)=>{
    res.send('Page Not Found')
})

app.use('/api/auth' , authRoutes)
app.use('/api/product' , productRoutes)
app.use('/api/cart' , cartRoutes)
app.use('/api/address' , addressRoutes)
app.use('/api/order' , orderRoutes)

app.use('/api/admin' , adminRoutes)

app.listen( PORT , ()=>{
    console.log('server is running on port:',PORT)
})
