import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDb = async () => {
    try {
        const connectionInstance = await mongoose.connect(
            `${process.env.MONGODB_URI}/${DB_NAME}`
        );

        console.log(`MongoDB connected!! DB host:`);
        console.log(connectionInstance.connections[0].host);
    } catch (e) {
        console.error("MongoDB connection failed: ", e);
        process.exit(1);
    }
};

export default connectDb;
