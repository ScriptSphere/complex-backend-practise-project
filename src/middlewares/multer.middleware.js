import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, "../../public/temp/images"));
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + file.originalname.replace(" ", ""));
    },
});

export const upload = multer({
    storage,
    dest: path.join(__dirname, "../../public/temp/images"),
});
