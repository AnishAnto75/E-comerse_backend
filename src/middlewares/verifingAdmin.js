const verifingAdmin = async(req , res , next) =>{
    try {
        const user = req.body.user
        if(!user){
            return res.status(400).json({message : "user not found"})
        }

        if(user.user_type == 'admin'){
            next()
        } else {
            return res.status(401).send({message : "un-authorized user"})
        }

    } catch (error) {
        return res.status(500).send({message : "error in verifingAdmin middleware" , error : error.stack })
    }
}

export default verifingAdmin