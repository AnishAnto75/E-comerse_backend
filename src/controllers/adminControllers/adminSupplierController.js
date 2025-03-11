import Supplier from '../../models/SupplierModel.js' 
import { apiErrorResponce, apiSucessResponce } from "../../utils/apiResponce.js"
import { generateRandom10DigitNumber } from '../../utils/generateRandomNumber.js'

export const adminCreateSupplier = async(req,res)=>{
    try {
        const {data} = req.body
        if(!data){return apiErrorResponce(res, "invalid credentials")}
        const {supplier_name, supplier_contact_person, supplier_contact_person_phone, supplier_email, supplier_phone, supplier_gst_no, supplier_address, supplier_bank_details } = data

        if(!supplier_name){return apiErrorResponce(res, "invalid credentials")}

        const supplier_id = `SUP${generateRandom10DigitNumber()}`

        const formatedData = {
            supplier_id,
            supplier_name,
            supplier_contact_person,
            supplier_contact_person_phone,
            supplier_email,
            supplier_phone,
            supplier_gst_no,
            supplier_address,
            supplier_bank_details
        }

        const supplier = new Supplier(formatedData)
        await supplier.save()

        return apiSucessResponce(res , "Supplier created sucessfully" , supplier)

    } catch (error) {
        console.log("error in create supplier controller :" , error)
        return apiErrorResponce(res, "Internal Server Error" )
    }
}


export const adminFetchAllSuppliers = async(req,res)=>{
    try {
        const suppliers = await Supplier.find()
        return apiSucessResponce(res, "All Suppliers Fetched Sucessfully", suppliers)
    } catch (error) {
        console.log("error in adminFetchAllSuppliers controller" , error)
        return apiErrorResponce(res , "internal Server Error")
    }
}

export const adminFetchSupplier = async(req,res)=>{
    try {
        const {id} = req.params
        const supplier = await Supplier.findOne({supplier_id : id})
        return apiSucessResponce(res, "Supplier Found Successfully", supplier)
    } catch (error){
        console.log("error in adminFetchSupplier controller" , error)
        return apiErrorResponce(res , "internal Server Error")
    }
}