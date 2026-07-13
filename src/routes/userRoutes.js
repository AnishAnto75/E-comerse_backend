import express from "express";

import verifyUser from "../middlewares/verifyUser.js";
import { fetchProducts } from "../controllers/clientControllers/productController.js";
import { addToCart, fetchCart, fetchFullCart } from "../controllers/clientControllers/cartController.js";

const router = express.Router()


// product
router.get('/product' , fetchProducts)


// cart
router.get('/cart' , verifyUser , fetchCart)
router.post('/cart/add' , verifyUser , addToCart)
router.post('/cart/full-cart' , verifyUser , fetchFullCart)










export default router