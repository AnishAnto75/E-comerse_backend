import express from "express";

import verifyUser from "../middlewares/verifyUser.js";
import { fetchProducts } from "../controllers/clientControllers/productController.js";
import { addToCart, fetchCart, fetchFullCart, minusToCart, removeProductFromCart } from "../controllers/clientControllers/cartController.js";
import { addAddress, deleteAddress, fetchAddress } from "../controllers/clientControllers/addressController.js";

const router = express.Router()


// product
router.get('/product' , fetchProducts)


// cart
router.get('/cart' , verifyUser , fetchCart)
router.post('/cart/add' , verifyUser , addToCart)
router.post('/cart/minus' , verifyUser , minusToCart)
router.post('/cart/remove' , verifyUser , removeProductFromCart)
router.get('/cart/full-cart' , verifyUser , fetchFullCart)


// address
router.get('/address' , verifyUser , fetchAddress)
router.post('/address/add' , verifyUser , addAddress)
router.patch('/address/delete' , verifyUser , deleteAddress)








export default router