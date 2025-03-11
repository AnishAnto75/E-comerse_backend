import express from "express";
import verifyUser from "../middlewares/verifyUser.js";
import { addCart , removeCart } from "../controllers/clientControllers/cartController.js";

const router = express.Router()

router.post('/add-product-to-cart' , verifyUser , addCart )
router.patch('/remove-product-from-cart' , verifyUser , removeCart )

export default router