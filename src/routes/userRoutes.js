import express from "express";

import verifyUser from "../middlewares/verifyUser.js";
import { fetchProducts } from "../controllers/clientControllers/productController.js";

const router = express.Router()


// product
router.get('/product' , fetchProducts)








export default router