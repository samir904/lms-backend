import path from "path";
import multer from "multer";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, "uploads/");
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = [".jpg", ".jpeg", ".webp", ".png",".mp4", ".m4v", ".mov", ".avi", ".mkv", ".webm"];
  if (!allowedExtensions.includes(ext)) {
    return cb(
      new Error(
        `Unsupported file type: ${ext}. Allowed types: ${allowedExtensions.join(
          ", "
        )}`
      ),
      false
    );
  }
  cb(null, true);
};

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 100 MB max limit
  fileFilter,
});

export default upload;

// import path from "path";
// import multer from "multer";

// const upload = multer({
//     dest: "uploads/",
//     limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB max limit
//     storage: multer.diskStorage({
//         destination: "uploads/",
//         filename: (_req, file, cb) => {
//             const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
//             cb(null, `${uniqueSuffix}-${file.originalname}`);
//         },
//     }),
//     fileFilter: (_req, file, cb) => {
//         const ext = path.extname(file.originalname).toLowerCase();
//         const allowedExtensions = [".jpg", ".jpeg", ".webp", ".png", ".mp4"];
//         if (!allowedExtensions.includes(ext)) {
//             return cb(new Error(`Unsupported file type: ${ext}. Allowed types: ${allowedExtensions.join(", ")}`), false);
//         }
//         cb(null, true);
//     },
// });

// export default upload;