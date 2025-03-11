import Staff from '../../models/StaffModel.js'
import bcrypt from 'bcrypt'
import User from '../../models/UserModel.js'
import { apiErrorResponce, apiSucessResponce } from '../../utils/apiResponce.js'
import { generateRandom10DigitNumber } from '../../utils/generateRandomNumber.js'

export const adminAddNewStaff = async(req , res ) =>{

    try {
        const data = req.body.data
        if(!data){return apiErrorResponce(res, "Invalid Credentials")}
        const {staff_username , staff_email , staff_password , staff_type , staff_phone_number } = data

        // Validation
        if(!staff_username || !staff_email || !staff_password || !staff_type || !staff_phone_number){return apiErrorResponce(res, "Invalid Credentials")}

        const user = await User.findOne({email : staff_email})
        if(user){return apiErrorResponce(res, "Email already loged in to User")} 

        const existing_staff = await Staff.findOne({staff_email}) 
        if(existing_staff){return apiErrorResponce(res, "Email already loged in to Staff")}

        // Hashing Password
        const hashedPassword = await bcrypt.hash(staff_password , 10)
        req.body.data.staff_password = hashedPassword

        req.body.data.staff_id = `STF${generateRandom10DigitNumber()}`

        const newStaff = new Staff(req.body.data)
        await newStaff.save()

        return apiSucessResponce(res, "Staff Created Sucessfully", newStaff, 201)
    } catch (error) {
        console.log("addNewStaff error : ",error)
        return res.status(400).send({message : "Internal server Error" , error})
    }
}

export const adminFetchAllStaffs = async(req , res)=>{
    try {
        const staff = await Staff.find()
        return apiSucessResponce(res, "staff fetched sucessfully", staff)
    } catch (error) {
        console.log("error in adminFetchAllStaffs controller" , error)
        return apiErrorResponce(res , "internal Server Error")
    }
}

export const adminFetchStaff = async(req,res)=>{
    try {
        const {id} = req.params
        const staff = await Staff.findOne({staff_id : id})
        return apiSucessResponce(res, "Staff Found Successfully", staff)
    } catch (error) {
        console.log("error in adminFetchSupplier controller" , error)
        return apiErrorResponce(res , "internal Server Error")
    }
}
