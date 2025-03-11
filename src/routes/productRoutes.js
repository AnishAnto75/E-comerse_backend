import express from "express";
import { fetchAllProduct, fetchProduct } from "../controllers/clientControllers/productController.js";

const router = express.Router()

router.get('/all-products' , fetchAllProduct )
router.get('/:id' , fetchProduct )

export default router