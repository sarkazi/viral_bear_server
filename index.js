const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require('mongoose')
const path = require('path')
const body = require('body-parser')
mongoose.set('strictQuery', true)
app.use(cors());
const dotenv = require("dotenv").config()

const video2Router = require('./routes/video2.routes')
const uploadInfoRouter = require('./routes/uploadInfo.routes')
const workersRouter = require('./routes/workers.routes')



//app.use(express.json({ limit: "50mb" }));
//app.use(express.urlencoded({ limit: "50mb" }));
app.use(express.json({ extended: true }));
app.use(express.static(path.join(__dirname, "build")));
app.use(
   "/excel",
   body.urlencoded({
      extended: true,
   })
);


app.use('/video2', video2Router)
app.use('/uploadInfo', uploadInfoRouter)
app.use('/workers', workersRouter)



let PORT = process.env.PORT || 8888;

const start = async () => {
   try {
      await mongoose.connect(
         //"mongodb://localhost:27017/viralBear",
         `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}/${process.env.DB_NAME}`,
         {}
      );
      app.listen(PORT, () => {
         console.log("Server has been launched on PORT", PORT);
      });
   } catch (e) {
      console.log(e.message);
      console.log(e)
   }
};
start();





