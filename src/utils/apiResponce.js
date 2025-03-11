export const apiSucessResponce = (res, message="success", data=null, statusCode=200 )=>{
    return res.status(statusCode).send({status : true, statusCode, message , data })
}

export const apiErrorResponce = (res, message="failed", error=null,  statusCode=400 )=>{
    return res.status(statusCode).send({status: false, statusCode , message , error})
}
