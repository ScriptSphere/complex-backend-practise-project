import dotenv from "dotenv";
import connectDb from "./db/index.js";

dotenv.config({
    path: "./../.env",
});
console.log(process.env.MONGODB_URI);

connectDb();

/*
import express from "express";
const app = express();

(async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_RUI}/${DB_NAME}`);
        app.on("error", (error) => {
            throw error;
        });

        app.listen(process.env.PORT, () => {
            console.log(`App listening on port ${process.env.PORT}`);
        });
    } catch (err) {
        console.error(err);
    }
})();
*/
