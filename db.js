import mongoose from "mongoose"

const connectDb = async() => {
    try {
        const connect=await mongoose.connect("mongodb+srv://pbllworld:goal12345@powerball.lllsua4.mongodb.net/EDates?retryWrites=true&w=majority", {
           
        })
        if (connect) {
            console.log("you have successfully connected to the Database")
        } else {
            console.log("there is an error")
            
        }
    } catch (error) {
        console.log(error)
        
    }
}



export default connectDb