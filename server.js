
import app from "./app.js"
import connectionToDb from "./config/dbConnection.js";
const port=process.env.PORT;
import cloudinary from "cloudinary"
import Razorpay from "razorpay"

cloudinary.v2.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
})

 const  razorpay=new Razorpay({
    key_id:process.env.RAZORPAY_KEY_ID,
    key_secret:process.env.RAZORPAY_SECRET,

})

app.listen(port,async()=>{
    await connectionToDb();
    console.log(`app is listning on port${port}`)
    
})

export default razorpay;

