import express from "express";
import verifyUser from "../middlewares/verifyUser.js";
import { addAddress, deleteAddress, editAddress } from "../controllers/clientControllers/addressController.js";

const router = express.Router()

router.post('/add-address' , verifyUser , addAddress )
router.patch('/delete-address' , verifyUser , deleteAddress )
router.patch('/edit-address' , verifyUser , editAddress )

export default router