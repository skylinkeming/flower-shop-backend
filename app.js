const path = require("path");
const fs = require("fs");

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const multer = require("multer");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");

// const upload = multer({ dest: "uploads/" });
const upload = multer({ dest: "/tmp/" });

const feedRoutes = require("./routes/feed");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const productRoutes = require("./routes/product");

// const accessLogStream = fs.createWriteStream(
//   path.join(__dirname, "access.log"),
//   { flags: "a" }
// );

const { uploadFile, getFileStream } = require("./s3");
// const { uploadImageToCloudflare } = require("./cloudflare");

const app = express();
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(compression());
// app.use(morgan("combined", { stream: accessLogStream }));

// const fileStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "uploadImages");Ｆ
//   },
//   filename: (req, file, cb) => {
//     cb(null, new Date().toISOString() + "-" + file.originalname);
//   },
// });

// const fileFilter = (req, file, cb) => {
//   if (
//     file.mimetype === "image/png" ||
//     file.mimetype === "image/jpg" ||
//     file.mimetype === "image/jpeg"
//   ) {
//     cb(null, true);
//   } else {
//     cb(null, false);
//   }
// };

// const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.7sghq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0/${process.env.MONGO_DEFAULT_DATABASE}`;
const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.osemr.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}`;


console.log({ MONGODB_URI })

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());

// app.use(
//   multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
// );

// app.use("/uploadImages", express.static(path.join(__dirname, "uploadImages")));

const corsOptions = {
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  allowedHeaders: [ "Content-Type", "Authorization" ],
};

app.use(cors(corsOptions));

app.use("/feed", feedRoutes);
app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/product", productRoutes);


app.get("/uploadImages/:filename", (req, res) => {
  const fileName = req.params.filename;
  try {
    const readStream = getFileStream(fileName);
    readStream.pipe(res);
  }catch(err){
    console.log(err);
    res.status(500).send({ message: "Error retrieving S3 file" });
  }
});

app.post("/uploadImages", upload.single("image"), async (req, res) => {
  const file = req.file;
  // const result = uploadImageToCloudflare(file)
  const result = await uploadFile(file);
  console.log("result",result);
  // console.log(result.Key)
  res.send({ message: "上傳成功", imagePath: `/uploadImages/${result.Key}` });
  // res.send({message:"上傳成功"});
});

app.use((error, req, res, next) => {
  const statusCode = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(statusCode).json({ message: message, data: data });
});

mongoose
  .connect(MONGODB_URI)
  .then((result) => {
    // console.log(result);
    const server = app.listen(process.env.PORT || 8080, () => {
      const port = server.address().port;
      console.log(`Express is working on port ${port}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });
