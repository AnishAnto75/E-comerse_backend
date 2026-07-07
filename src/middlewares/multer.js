import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const createStorage = (folder) => {
    return multer.diskStorage({
        destination: (req, file, cb) => {
            const uploadPath = `uploads/${folder}`;
            fs.mkdirSync(uploadPath, { recursive: true });
            cb(null, uploadPath);
        },

        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname);
            cb(null, `${crypto.randomUUID()}${ext}`);
        }
    });
};

const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp"
];

const fileFilter = (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
        return cb(null, true);
    }

    cb(new Error("Only JPEG, JPG, PNG and WEBP images are allowed."));
};

const createUpload = (folder, maxFiles = 1) =>
    multer({
        storage: createStorage(folder),
        fileFilter,
        limits: {
            fileSize: 5 * 1024 * 1024, // 5 MB
            files: maxFiles
        }
    });

export const uploadGroupImage = createUpload("groups", 1);

export const uploadCategoryImage = createUpload("categories", 1);

export const uploadBrandImage = createUpload("brands", 1);

export const uploadProductImage = createUpload("products", 6);