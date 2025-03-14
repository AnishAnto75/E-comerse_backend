import express from "express";
import verifyUser from "../middlewares/verifyUser.js";
import { cancelOrder, createOrder, getAllOrder, getOrder, returnOrder} from "../controllers/clientControllers/orderController.js";

const router = express.Router()

router.post('/create-order' , verifyUser , createOrder)
router.get('/get-orders' , verifyUser , getAllOrder)
router.get('/get-order/:id' , verifyUser , getOrder)
router.patch('/cancel/:id' , verifyUser , cancelOrder)
router.patch('/return/:id' , verifyUser , returnOrder)

export default router