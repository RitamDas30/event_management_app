import { timeStamp } from 'console'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.schema({
    userName : {
        type : String , 
        required : true ,
    },
    email : {
        type : String, 
        required : true , 
        unique : true , 
        lowercase : true ,
    },

    password : {
        type : String , 
        required :  [true , "password is required"],
    }, 

    role : {
        type : String,
        enum : ["student", "organizer", "admin"],
        default : "student"
    }, 

    preferences :{
        type : String, 
        default : [],
    }, 
    
}, {timeStamp : true })

userSchema.pre("save", async (next) => {
    if (this.isModified("password")){
        return next()
    } 
    this.password = await bcrypt.hash(this.password, 10 )
    next() 
})

userSchema.methods.matchPassword = async function (enteredPassword){
    return await bcrypt.compare(enteredPassword, this.password)
}



export default mongoose.model("User", userSchema)