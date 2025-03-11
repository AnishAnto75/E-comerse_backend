import User from "../../models/UserModel.js"
import { apiErrorResponce, apiSucessResponce } from "../../utils/apiResponce.js"

export const addAddress = async(req , res) =>{
    try {
        const user = req.body.user
        const data = req.body.data
        if(!data){return apiErrorResponce(res, "Invalid Credentials")}

        const {name , phoneNo , pincode , city , district , state} = data

        if(!name || !phoneNo || !pincode || !city || !district || !state ){ return apiErrorResponce(res , "invalid Credentials")}

        if(!user.address){
            try {
                const newUser = await User.findOneAndUpdate({_id : user._id} , {address: data} , {new : true}).select('address')
                return apiSucessResponce(res , "address added sucessfully" , newUser)
            } catch (error) {
                console.log("Error in addAddress controller : ", error )
                return apiErrorResponce(res , "Internal server error")
            }
        }

        const newUser = await User.findOneAndUpdate({_id : user._id} , {address : [...user.address , data]} , {new : true }).select('address')
        return apiSucessResponce(res , "Address Added Successfully" , newUser )

    } catch (error) {
        console.log("Error in addAddress controller : ", error )
        return apiErrorResponce(res , "Internal Server Error")
    }
}

export const deleteAddress = async(req , res)=>{
    try {
        const data = req.body.data
        if(!data){return apiErrorResponce(res, "Invalid Credentials")}

        const {_id} = data
        const user = req.body.user
        const address = req.body.user.address

        console.log(_id)
        if(!address || !_id){ return apiErrorResponce(res , "Invalid Credentials")}

        let newAddresses = address.map(address =>{
            if(address._id.toString() == _id.toString()){ return } 
            else { return address}
        })

        newAddresses = newAddresses.filter( (e)=> {return e }); // Removes the null and undefined values 

        const userAddress = await User.findOneAndUpdate({_id : user._id},{address : newAddresses} , {new : true}).select('address')

        return apiSucessResponce(res , "Address Deleted Successfully" , userAddress)
    } catch (error) {
        console.log("Error in deleteAddress controller : ", error )
        return apiErrorResponce(res , "Internal Server Error")
    }
}

export const editAddress = async(req , res)=>{
    try{
        const data = req.body.data
        const {user} = req.body
        const {address} = req.body.user

        if(!address || !data || !data._id || !data.name || !data.phoneNo || !data.pincode || !data.city || !data.district || !data.state){ return apiErrorResponce(res , "Invalid Credentials")}

        let newAddresses = address.map((address) =>{
            if(address._id.toString() == data._id.toString()){return data} 
            else { return address }
        })

        const userAddress = await User.findOneAndUpdate({_id : user._id},{address : newAddresses} , {new : true}).select('address')
        return apiSucessResponce(res , "Address Edited Sucessfully" , userAddress)

    } catch(error) {
        console.log("Error in editAddress controller : ", error )
        return apiErrorResponce(res , "Internal server error")
    }
}