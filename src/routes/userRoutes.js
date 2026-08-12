import express from "express";

import verifyUser from "../middlewares/verifyUser.js";
import { fetchProducts } from "../controllers/clientControllers/productController.js";
import { addToCart, fetchCartSummary, fetchFullCart, minusToCart, removeProductFromCart } from "../controllers/clientControllers/cartController.js";
import { addAddress, deleteAddress, fetchAddress } from "../controllers/clientControllers/addressController.js";
import { createOrder, getAllOrder, getOrder } from "../controllers/clientControllers/orderController.js";

const router = express.Router()


// product
router.get('/product' , fetchProducts)


// cart
router.get('/cart/summary' , verifyUser , fetchCartSummary)
router.post('/cart/add' , verifyUser , addToCart)
router.post('/cart/minus' , verifyUser , minusToCart)
router.post('/cart/remove' , verifyUser , removeProductFromCart)
router.get('/cart/full-cart' , verifyUser , fetchFullCart)


// address
router.get('/address' , verifyUser , fetchAddress)
router.post('/address/add' , verifyUser , addAddress)
router.patch('/address/delete' , verifyUser , deleteAddress)


// order
router.get('/order' , verifyUser , getAllOrder)
router.post('/order/create' , verifyUser , createOrder)








export default router