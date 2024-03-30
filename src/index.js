import dotenv from "dotenv";
import connectDb from "./db/index.js";
import { app } from "./app.js";

const port = process.env.PORT || 8000;

dotenv.config({
    path: "./../.env",
});

connectDb()
    .then(() => {
        app.listen(port, () => {
            console.log(`Server is listening at http://localhost:${port}`);
        });
    })
    .catch((error) => {
        console.log("Mongodb connection failed: ", error);
    });

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
