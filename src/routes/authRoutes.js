import express from "express";
import {login, signUp, getUser, logout} from "../controllers/authControllers.js";
import verifyUser from "../middlewares/verifyUser.js";

const router = express.Router()

router.post('/signup' , signUp)
router.post('/login' , login)
router.get('/getUser', verifyUser , getUser)
router.post('/logout' ,verifyUser , logout)

export default router