import express from "express";
import verifyUser from "../middlewares/verifyUser.js";
import { alterProductCart, addToCart, fetchCart, removeCart } from "../controllers/clientControllers/cartController.js";

const router = express.Router()

router.post('/add-product-to-cart' , verifyUser , addToCart )
router.post('/alter-product-cart' , verifyUser , alterProductCart )
router.patch('/remove-product-from-cart' , verifyUser , removeCart )
router.get('/fetch-cart' , verifyUser , fetchCart )

export default router