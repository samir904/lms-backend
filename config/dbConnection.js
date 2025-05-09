import mongoose from "mongoose";

mongoose.set(`strictQuery`,false);//it basically means if you dont have the info about do'nt crash or throw error

const connectionToDb=async()=>{
    try{
        const {connection}= await mongoose.connect(process.env.MONGO_URL||"mongodb://127.0.0.1:27017/lmstwo");

        if(connection){
            console.log(`connected to mogo db${connection.host}`)
        }
    }catch(err){
        console.log(err)
        process.exit(1);
    }
    
}

export default connectionToDb;