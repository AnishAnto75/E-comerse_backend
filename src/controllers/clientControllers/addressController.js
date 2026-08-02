import mongoose from "mongoose";
import User from "../../models/UserModel.js"
import { apiErrorResponce, apiSucessResponce } from "../../utils/apiResponce.js"
import Address from "../../models/AddressModel.js";

export const addAddress = async(req , res) =>{

    const session = await mongoose.startSession();

    try {

        const userId = req.user._id;

        const { name, phone_number, alternate_phone_number = "", house_no, area, landmark = "", city, district, state, pincode, address_type = "Home", is_default = false} = req.body;

        if ( !name.trim() || !phone_number.trim() || !house_no.trim() || !area.trim() || !city.trim() || !district.trim() || !state.trim() || !pincode.trim() ) { return apiErrorResponce(res, "Please fill all required fields") }

        const phoneRegex = /^[6-9]\d{9}$/

        if (!phoneRegex.test(phone_number)) { return apiErrorResponce(res, "Invalid phone number")}
        if ( alternate_phone_number && !phoneRegex.test(alternate_phone_number.trim())) { return apiErrorResponce(res, "Invalid alternate phone number")}
        if (!/^\d{6}$/.test(pincode.trim())) { return apiErrorResponce(res, "Invalid pincode")}
        if (!["home", "work"].includes(address_type)) { return apiErrorResponce(res, "Invalid address type")}

        session.startTransaction();

        const addressCount = await Address.countDocuments({user_id: userId}).session(session);

        if (addressCount >= 5) { 
            await session.abortTransaction();
            return apiErrorResponce(res, "Maximum address limit reached");
        }

        const makeDefault = is_default || addressCount === 0;

        if (makeDefault) {
            await Address.updateMany( { user_id: userId, is_default: true }, { $set: { is_default: false },}, { session });
        }

        const [address] = await Address.create([
            {
                user_id: userId,
                name: name.trim(),
                phone_number: phone_number.trim(),
                alternate_phone_number: alternate_phone_number.trim(),
                house_no: house_no.trim(),
                area: area.trim(),
                landmark: landmark.trim(),
                city: city.trim(),
                district: district.trim(),
                state: state.trim(),
                pincode: pincode.trim(),
                address_type,
                is_default: makeDefault,
            },
        ], { session });

        await session.commitTransaction();
        return apiSucessResponce( res, "Address added successfully", address, 201 );

    } catch (error) {
        await session.abortTransaction();
        console.log("addAddress error :", error);
        return apiErrorResponce(res, "Internal Server Error");
    } finally { session.endSession() }
};

export const fetchAddress = async(req , res) =>{
    try {
    
        const address = await Address.find({ user_id: req.user._id })

        return apiSucessResponce(res, "Success", address );

    } catch (error) {
        console.log("fetchAddress controller error :", error)
        apiErrorResponce(res , "Internal Server Error" , null , 500)
    }
};

export const deleteAddress = async (req, res) => {

    const session = await mongoose.startSession();

    try {

        const userId = req.user._id;
        const { _id } = req.body;

        if (!mongoose.Types.ObjectId.isValid(_id)) { return apiErrorResponce(res, "Invalid Address") }

        session.startTransaction();

        const address = await Address.findOne({ _id, user_id: userId }).session(session);
        if (!address) { await session.abortTransaction(); return apiErrorResponce(res, "Address not found", 404) }

        await Address.deleteOne({ _id, user_id: userId }).session(session);

        if (address.is_default) {
            const nextAddress = await Address.findOne({ user_id: userId }).sort({ createdAt: -1 }).session(session);
            if (nextAddress) {
                nextAddress.is_default = true;
                await nextAddress.save({ session });
            }
        }
        await session.commitTransaction();
        return apiSucessResponce(res, "Address deleted successfully");

    } catch (error) {
        await session.abortTransaction();
        console.log("deleteAddress error:", error);
        return apiErrorResponce(res, "Internal Server Error");
    } finally { session.endSession() }
};







// old codes

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