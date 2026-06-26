import { Types } from "mongoose";
const {ObjectId} = Types

export const validateMongooseId = (id)=>{
    if(Types.ObjectId.isValid(id)){
        if((String)(new ObjectId(id)) === id)
            return true;        
        return false;
    }
    return false;
}

export const validateDate = (dateString) => {
    const isDate = (dateString) => !isNaN(Date.parse(dateString))
    return isDate(dateString)
}