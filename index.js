const express = require("express");
const app = express();
const path = require("path");
const cors = require("cors");
const multer = require("multer");
const moment = require("moment")
const dotenv = require("dotenv").config()
const mongoose = require("mongoose");
const Video2 = require("./video2/Video2");
const UploadInfo = require("./uploadInfo/UploadInfo");

app.use(express.static("mrssFiles"));
mongoose.set("strictQuery", false);

const { generateVideoId } = require('./utils/generateVideoId')


app.use(cors());

let PORT = process.env.PORT || 8888;


var EasyYandexS3 = require("easy-yandex-s3");
var s3 = new EasyYandexS3({
   auth: {
      accessKeyId: process.env.YANDEX_CLOUD_KEY_ID,
      secretAccessKey: process.env.YANDEX_CLOUD_ACCESS_KEY,
   },
   Bucket: "viralbear",
   debug: false,
});



app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb" }));
app.use(express.json({ extended: true }));
app.set("view engine", "ejs");
app.set("views", path.resolve(__dirname, "ejs"));
app.use(express.static(path.join(__dirname, "build")));





const storage = multer.memoryStorage();



app.get("/api/uploadInfo/findOne/:id", async (req, res) => {
   try {
      const { id } = req.params;
      const form = await UploadInfo.findOne({
         formId: `VB${id}`,
      });
      if (!form) {
         return res.status(200).json({ message: "Форма не найдена!" });
      }
      res.status(200).json(form);
   } catch (err) {
      console.log(err);
      throw Error("Ошибка базы данных");
   }
});


app.post("/api/video2/addVideo",

   multer({ storage: storage }).fields([
      {
         name: "video",
         maxCount: 1
      },
      {
         name: "screen",
         maxCount: 1
      }
   ]),


   async (req, res) => {

      try {
         const {
            originalLink,
            vbCode,
            authorEmail,
            percentage,
            advancePayment,
            researchers,
            title,
            desc,
            creditTo,
            tags,
            category,
            city,
            country,
            date,
            trelloCardUrl,
            brandSafe,
            trelloCardId,
            trelloCardName,
            priority,
            whereFilmed,
            whyDecide,
            whatHappen,
            whenFilmed,
            whoAppears,
            agreementLink
         } = req.body



         const { video, screen } = req.files



         const isHasVideoWithVbCode = await Video2.findOne({
            "uploadData.vbCode": `VB${vbCode}`
         })

         if (isHasVideoWithVbCode) {
            return res.status(200).json({ message: 'a video with such a "vbcode" is already in the database' })
         }

         const videoId = await generateVideoId()

         try {
            if (
               video[0].originalname.substr(-3) === "mp4" &&
               screen[0].originalname.substr(-3) === "jpg"
            ) {
               var bucketRequest = await s3.Upload(
                  [
                     {
                        buffer: video[0].buffer,
                        name: videoId + "." + video[0].originalname.substr(-3),
                     },
                     {
                        buffer: screen[0].buffer,
                        name: videoId + "." + screen[0].originalname.substr(-3),
                     },
                  ],
                  "/test4/"
               );
            } else {
               return res.status(201).json({ message: "File formats are incorrect" });
            }
         } catch (err) {
            console.log(err)
            return res
               .status(500)
               .json({ message: "Error during upload to yandex cloud" });

         }

         const decodeResearchers = JSON.parse(researchers)
         const decodeTags = JSON.parse(tags)
         const decodePriority = JSON.parse(priority)



         const newVideo = await Video2.create({
            videoData: {
               videoId: videoId,
               originalVideoLink: originalLink,
               title: title,
               description: desc,
               creditTo: creditTo && creditTo,
               tags: decodeTags,
               category: category,
               city: city,
               country: country,
               date: date,
            },
            trelloData: {
               trelloCardUrl: trelloCardUrl,
               trelloCardId: trelloCardId,
               trelloCardName: trelloCardName,
               researchers: decodeResearchers,
               priority: decodePriority,
            },
            uploadData: {
               agreementLink: agreementLink && agreementLink,
               vbCode: vbCode && `VB${vbCode}`,
               authorEmail: authorEmail && authorEmail,
               advancePayment: advancePayment && advancePayment,
               percentage: percentage && advancePayment,
               whereFilmed: whereFilmed && whereFilmed,
               whyDecide: whyDecide && whyDecide,
               whatHappen: whatHappen && whatHappen,
               whenFilmed: whenFilmed && whenFilmed,
               whoAppears: whoAppears && whoAppears
            },
            bucket: {
               cloudVideoLink: bucketRequest.find(el => el.Key.substr(-3) === 'mp4').Location,
               cloudScreenLink: bucketRequest.find(el => el.Key.substr(-3) === 'jpg').Location,
               cloudVideoPath: bucketRequest.find(el => el.Key.substr(-3) === 'mp4').Key,
               cloudScreenPath: bucketRequest.find(el => el.Key.substr(-3) === 'jpg').Key,
            },
            brandSafe: brandSafe,
         })

         res.status(200).json(newVideo)
      } catch (err) {
         console.log(err);
         res
            .status(500)
            .json({ message: "Something went wrong, please try again" });
      }
   });


app.get("/api/video2/findOne", async (req, res) => {
   try {
      const lastAddedVideo = await Video2.findOne({})
         .sort({ createdAt: -1 })
         .limit(1)
      if (!lastAddedVideo) {
         return res.status(200).json({ message: "No data found!" });
      }
      res.status(200).json(lastAddedVideo);
   } catch (err) {
      console.log(err);
      throw Error("Database error!");
   }
});


app.get("/api/video2/findByNotApproved", async (req, res) => {
   try {
      const videos = await Video2.find({
         isApproved: false,
         needToBeFixed: { $exists: false }
      }, { _id: false, __v: false, updatedAt: false })

      res.status(200).json(videos);
   } catch (err) {
      console.log(err);
      throw Error("Server side error...");
   }
});


app.get("/api/video2/findByIsBrandSafe", async (req, res) => {
   try {
      const videos = await Video2.find({
         brandSafe: true
      }, { _id: false, __v: false, updatedAt: false })

      res.status(200).json(videos);
   } catch (err) {
      console.log(err);
      throw Error("Server side error...");
   }
});


app.get("/api/video2/findByFixed", async (req, res) => {
   try {
      const videos = await Video2.find({
         isApproved: false,
         needToBeFixed: { '$exists': true }
      }, { _id: false, __v: false, updatedAt: false })

      res.status(200).json(videos);
   } catch (err) {
      console.log(err);
      throw Error("Server side error...");
   }
});


app.get("/api/video2/findOne/:id", async (req, res) => {
   try {

      const { id } = req.params

      const video = await Video2.findOne({ "videoData.videoId": +id })

      console.log(video, 99999)

      if (!video) {
         res.status(200).json({ message: `Video with id "${id}" was not found` })
         return
      }

      const { _id, __v, updatedAt, ...data } = video._doc

      res.status(200).json(data)

   } catch (err) {
      console.log(err);
      throw Error("database error");
   }
});


app.patch("/api/video2/update",

   multer({ storage: storage }).fields([
      {
         name: "video",
         maxCount: 1
      },
      {
         name: "screen",
         maxCount: 1
      }
   ]),

   async (req, res) => {
      try {

         const {
            originalLink,
            vbCode,
            authorEmail,
            percentage,
            advancePayment,
            researchers,
            title,
            desc,
            creditTo,
            tags,
            category,
            city,
            country,
            date,
            videoId,
            brandSafe
         } = req.body

         const { video: reqVideo, screen: reqScreen } = req.files

         const video = await Video2.findOne({ "videoData.videoId": +videoId })

         if (!video) {
            res.status(200).json({ message: `Video with id "${+videoId}" was not found` })
            return
         }

         if (video.isApproved === true) {
            res.status(200).json({ message: `You cannot edit a published video!` })
            return
         }

         try {
            if (reqVideo && !reqScreen) {
               if (
                  reqVideo[0].originalname.substr(-3) === "mp4"
               ) {

                  await s3.Remove(video.bucket.cloudVideoPath)

                  var bucketRequest = await s3.Upload(
                     [
                        {
                           buffer: reqVideo[0].buffer,
                           name: videoId + "." + reqVideo[0].originalname.substr(-3),
                        },
                     ],
                     "/test4/"
                  );
               } else {
                  return res.status(201).json({ message: "File formats are incorrect" });
               }
            }
            if (!reqVideo && reqScreen) {
               if (
                  reqScreen[0].originalname.substr(-3) === "jpg"
               ) {

                  await s3.Remove(video.bucket.cloudScreenPath)

                  var bucketRequest = await s3.Upload(
                     [
                        {
                           buffer: reqScreen[0].buffer,
                           name: videoId + "." + reqScreen[0].originalname.substr(-3),
                        },
                     ],
                     "/test4/"
                  );
               } else {
                  return res.status(201).json({ message: "File formats are incorrect" });
               }
            }
            if (reqVideo && reqScreen) {
               if (
                  reqScreen[0].originalname.substr(-3) === "jpg" &&
                  reqVideo[0].originalname.substr(-3) === "mp4"
               ) {

                  await s3.Remove(video.bucket.cloudScreenPath)
                  await s3.Remove(video.bucket.cloudVideoPath)

                  var bucketRequest = await s3.Upload(
                     [
                        {
                           buffer: reqScreen[0].buffer,
                           name: videoId + "." + reqScreen[0].originalname.substr(-3),
                        },
                        {
                           buffer: reqVideo[0].buffer,
                           name: videoId + "." + reqVideo[0].originalname.substr(-3),
                        },
                     ],
                     "/test4/"
                  );
               } else {
                  return res.status(201).json({ message: "File formats are incorrect" });
               }
            }
         } catch (err) {
            console.log(err)
            return res
               .status(500)
               .json({ message: "Error during upload to yandex cloud" });
         }


         await video.updateOne({
            $set: {
               "videoData.originalVideoLink": originalLink && originalLink,
               "uploadData.vbCode": vbCode && `VB${vbCode}`,
               "uploadData.authorEmail": authorEmail && authorEmail,
               "uploadData.percentage": percentage && +JSON.parse(percentage),
               "uploadData.advancePayment": advancePayment && +JSON.parse(advancePayment),
               "videoData.title": title && title,
               "videoData.description": desc && desc,
               "videoData.creditTo": creditTo && creditTo,
               "videoData.tags": tags && JSON.parse(tags),
               "videoData.category": category && category,
               "videoData.city": city && city,
               "videoData.country": country && country,
               "videoData.date": date && JSON.parse(date),
               "trelloData.researchers": researchers && JSON.parse(researchers),
               brandSafe: brandSafe && JSON.parse(brandSafe),
               "bucket.cloudVideoLink": bucketRequest && bucketRequest.find(el => el.Key.substr(-3) === 'mp4') &&
                  bucketRequest.find(el => el.Key.substr(-3) === 'mp4').Location,
               "bucket.cloudScreenLink": bucketRequest && bucketRequest.find(el => el.Key.substr(-3) === 'jpg') &&
                  bucketRequest.find(el => el.Key.substr(-3) === 'jpg').Location,
               "bucket.cloudVideoPath": bucketRequest && bucketRequest.find(el => el.Key.substr(-3) === 'mp4') &&
                  bucketRequest.find(el => el.Key.substr(-3) === 'mp4').Key,
               "bucket.cloudScreenPath": bucketRequest && bucketRequest.find(el => el.Key.substr(-3) === 'jpg') &&
                  bucketRequest.find(el => el.Key.substr(-3) === 'jpg').Key,
            }
         })

         const updatedVideo = await Video2.findOne({
            "videoData.videoId": +videoId
         })

         const { _id, __v, updatedAt, ...data } = updatedVideo._doc

         res.status(200).json(data)

      } catch (err) {
         console.log(err);
         throw Error("Server-side error...");
      }
   });


app.patch("/api/video2/fixedVideo",

   multer({ storage: storage }).fields([
      {
         name: "video",
         maxCount: 1
      },
      {
         name: "screen",
         maxCount: 1
      }
   ]),

   async (req, res) => {
      try {

         const {
            originalLink,
            vbCode,
            authorEmail,
            percentage,
            advancePayment,
            researchers,
            title,
            desc,
            creditTo,
            tags,
            category,
            city,
            country,
            date,
            videoId,
            brandSafe
         } = req.body

         const { video: reqVideo, screen: reqScreen } = req.files

         const video = await Video2.findOne({ "videoData.videoId": +videoId })

         if (!video) {
            res.status(200).json({ message: `Video with id "${+videoId}" was not found` })
            return
         }

         if (video.isApproved === true) {
            res.status(200).json({ message: `You cannot edit a published video!` })
            return
         }

         try {
            if (reqVideo && !reqScreen) {
               if (
                  reqVideo[0].originalname.substr(-3) === "mp4"
               ) {

                  await s3.Remove(video.bucket.cloudVideoPath)

                  var bucketRequest = await s3.Upload(
                     [
                        {
                           buffer: reqVideo[0].buffer,
                           name: videoId + "." + reqVideo[0].originalname.substr(-3),
                        },
                     ],
                     "/test4/"
                  );
               } else {
                  return res.status(201).json({ message: "File formats are incorrect" });
               }
            }
            if (!reqVideo && reqScreen) {
               if (
                  reqScreen[0].originalname.substr(-3) === "jpg"
               ) {

                  await s3.Remove(video.bucket.cloudScreenPath)

                  var bucketRequest = await s3.Upload(
                     [
                        {
                           buffer: reqScreen[0].buffer,
                           name: videoId + "." + reqScreen[0].originalname.substr(-3),
                        },
                     ],
                     "/test4/"
                  );
               } else {
                  return res.status(201).json({ message: "File formats are incorrect" });
               }
            }
            if (reqVideo && reqScreen) {
               if (
                  reqScreen[0].originalname.substr(-3) === "jpg" &&
                  reqVideo[0].originalname.substr(-3) === "mp4"
               ) {

                  await s3.Remove(video.bucket.cloudScreenPath)
                  await s3.Remove(video.bucket.cloudVideoPath)

                  var bucketRequest = await s3.Upload(
                     [
                        {
                           buffer: reqScreen[0].buffer,
                           name: videoId + "." + reqScreen[0].originalname.substr(-3),
                        },
                        {
                           buffer: reqVideo[0].buffer,
                           name: videoId + "." + reqVideo[0].originalname.substr(-3),
                        },
                     ],
                     "/test4/"
                  );
               } else {
                  return res.status(201).json({ message: "File formats are incorrect" });
               }
            }
         } catch (err) {
            console.log(err)
            return res
               .status(500)
               .json({ message: "Error during upload to yandex cloud" });
         }


         await video.updateOne({
            $set: {
               "videoData.originalVideoLink": originalLink && originalLink,
               "uploadData.vbCode": vbCode && `VB${vbCode}`,
               "uploadData.authorEmail": authorEmail && authorEmail,
               "uploadData.percentage": percentage && +JSON.parse(percentage),
               "uploadData.advancePayment": advancePayment && +JSON.parse(advancePayment),
               "videoData.title": title && title,
               "videoData.description": desc && desc,
               "videoData.creditTo": creditTo && creditTo,
               "videoData.tags": tags && JSON.parse(tags),
               "videoData.category": category && category,
               "videoData.city": city && city,
               "videoData.country": country && country,
               "videoData.date": date && JSON.parse(date),
               "trelloData.researchers": researchers && JSON.parse(researchers),
               brandSafe: brandSafe && JSON.parse(brandSafe),
               "bucket.cloudVideoLink": bucketRequest && bucketRequest.find(el => el.Key.substr(-3) === 'mp4') &&
                  bucketRequest.find(el => el.Key.substr(-3) === 'mp4').Location,
               "bucket.cloudScreenLink": bucketRequest && bucketRequest.find(el => el.Key.substr(-3) === 'jpg') &&
                  bucketRequest.find(el => el.Key.substr(-3) === 'jpg').Location,
               "bucket.cloudVideoPath": bucketRequest && bucketRequest.find(el => el.Key.substr(-3) === 'mp4') &&
                  bucketRequest.find(el => el.Key.substr(-3) === 'mp4').Key,
               "bucket.cloudScreenPath": bucketRequest && bucketRequest.find(el => el.Key.substr(-3) === 'jpg') &&
                  bucketRequest.find(el => el.Key.substr(-3) === 'jpg').Key,
            }
         })

         await Video2.updateOne(
            { "videoData.videoId": +videoId }, { $unset: { needToBeFixed: 1 } }
         )

         const updatedVideo = await Video2.findOne({
            "videoData.videoId": +videoId
         })


         const { _id, __v, updatedAt, ...data } = updatedVideo._doc

         res.status(200).json(data)

      } catch (err) {
         console.log(err);
         throw Error("Server-side error...");
      }
   });


app.patch("/api/video2/addCommentForFixed", async (req, res) => {
   try {

      const {
         comment,
         videoId
      } = req.body


      const video = await Video2.findOne({ "videoData.videoId": videoId })

      if (!video) {
         res.status(200).json({ message: `Video with id "${videoId}" was not found` })
         return
      }

      if (video.isApproved === true) {
         res.status(200).json({ message: `You can't fix a published video!` })
         return
      }

      await video.updateOne({
         needToBeFixed: {
            comment
         },
      })

      const updatedVideo = await Video2.findOne({ "videoData.videoId": videoId })

      const { _id, __v, updatedAt, ...data } = updatedVideo._doc

      res.status(200).json(data)

   } catch (err) {
      console.log(err);
      throw Error("Server-side error...");
   }
});


app.patch("/api/video2/publishing/:id", async (req, res) => {
   try {

      const {
         id
      } = req.params

      const video = await Video2.findOne({ "videoData.videoId": +id })

      if (!video) {
         res.status(200).json({ message: `Video with id "${id}" was not found` })
         return
      }

      if (video.isApproved === true) {
         res.status(200).json({ message: `The video with id "${id}" has already been published` })
         return
      }

      if (video.needToBeFixed) {
         return res.status(200).json({ message: `Before publishing, you need to make edits!` })
      }

      const {
         videoData: {
            title,
            description,
            creditTo,
            videoId,
            tags,
            city,
            country,
            category,
            date,
            originalVideoLink
         },
         bucket: {
            cloudVideoLink,
            cloudScreenLink
         },
         brandSafe,
         updatedAt,
         createdAt
      } = video





      if (
         !title ||
         !description ||
         !videoId ||
         !tags ||
         !city ||
         !country ||
         !category ||
         !date ||
         !originalVideoLink ||
         !cloudVideoLink ||
         !cloudScreenLink
      ) {
         return res.status(404).json({ message: "The video cannot be published. There is a missing parameter for the feed" })
      }


      const lastModif = moment(updatedAt).format('YYYY-MM-DD')
      const videoCreateDate = moment().format('YYYY-MM-DD');



      let credit;
      let creditMrss;
      if (!creditTo || creditTo == "") {
         credit = description;
         creditMrss = "";
      } else {
         credit = `${description}

      Credit to: ${creditTo}`;
         creditMrss = `Credit to: ${creditTo}`;
      }



      if (brandSafe === true) {
         await video.updateOne({
            $set: {
               mRSS2: `        <item>          <media:title>${title.replace(
                  /&/g,
                  "&amp;"
               )}</media:title>          <media:description>${description.replace(
                  /&/g,
                  "&amp;"
               )} ${creditMrss}</media:description>          <media:keywords>${tags}</media:keywords>          <media:city>${city}</media:city>          <media:country>${country}</media:country>          <media:category>${category}</media:category>          <media:filmingDate>${date}</media:filmingDate>          <guid>${videoId}</guid>          <media:youtubeLink>${originalVideoLink}</media:youtubeLink>          <pubDate>${videoCreateDate}</pubDate>          <media:thumbnail url="${cloudScreenLink
                  }" />          <media:content url="${cloudVideoLink
                  }" />          <dfpvideo:lastModifiedDate>${lastModif}</dfpvideo:lastModifiedDate>                </item>`,
               mRSS: `        <item>          <media:title>${title.replace(
                  /&/g,
                  "&amp;"
               )}</media:title>          <media:description>${description.replace(
                  /&/g,
                  "&amp;"
               )} ${creditMrss}</media:description>          <media:keywords>${tags}</media:keywords>          <media:city>${city}</media:city>          <media:country>${country}</media:country>          <media:category>${category}</media:category>          <media:filmingDate>${date}</media:filmingDate>          <guid>${videoId}</guid>          <media:youtubeLink>${originalVideoLink}</media:youtubeLink>          <pubDate>${videoCreateDate}</pubDate>          <media:thumbnail url="${cloudScreenLink
                  }" />          <media:content url="${cloudVideoLink
                  }" />          <dfpvideo:lastModifiedDate>${lastModif}</dfpvideo:lastModifiedDate>                  </item>`,
            }
         })
      } else {
         await video.updateOne({
            $set: {
               mRSS: `        <item>          <media:title>${title.replace(
                  /&/g,
                  "&amp;"
               )}</media:title>          <media:description>${description.replace(
                  /&/g,
                  "&amp;"
               )} ${creditMrss}</media:description>          <media:keywords>${tags}</media:keywords>          <media:city>${city}</media:city>          <media:country>${country}</media:country>          <media:category>${category}</media:category>          <media:filmingDate>${date}</media:filmingDate>          <guid>${videoId}</guid>          <media:youtubeLink>${originalVideoLink}</media:youtubeLink>          <pubDate>${videoCreateDate}</pubDate>          <media:thumbnail url="${cloudScreenLink
                  }" />          <media:content url="${cloudVideoLink
                  }" />          <dfpvideo:lastModifiedDate>${lastModif}</dfpvideo:lastModifiedDate>                  </item>`,
            }
         })
      }

      await video.updateOne({
         isApproved: true
      })

      res.status(200).json({
         trelloCardId: video.trelloData.trelloCardId,
         videoId: video.videoData.videoId,
         brandSafe: video.brandSafe
      })

   } catch (err) {
      console.log(err);
      throw Error("Server-side error...");
   }
});


app.delete("/api/video2/delete/:id", async (req, res) => {
   try {

      const { id } = req.params

      const video = await Video2.findOne({ "videoData.videoId": +id })


      if (!video) {
         res.status(200).json({ message: `Video with id "${id}" was not found` })
         return
      }

      await Video2.deleteOne({ "videoData.videoId": +id })

      res.status(200).json({ trelloCardId: video.trelloData.trelloCardId })

   } catch (err) {
      console.log(err);
      throw Error("Server-side error...");
   }
});


//app.post("/api/testtt", async (req, res) => {
//   try {

//      let list = await s3.GetList('/test4/');

//      console.log(list, 9999)

//      res.json('fidsjhfudjhdfj')

//   } catch (err) {
//      console.log(err);
//      throw Error("Server-side error...");
//   }
//});






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


//const { MongoClient } = require('mongodb');



//(async () => {
//   const uri = "mongodb+srv://nik0:11X8sv77mc04yyP4@10.0.0.10/viralBear?retryWrites=true&w=majority"
//   const client = new MongoClient(uri);
//   try {
//      await client.connect();

//      await listDatabases(client);

//   } catch (e) {
//      console.error(e);
//   } finally {
//      await client.close();
//   }

//})()


//async function main() {

//   const uri = "mongodb+srv://<username>:<password>@clustername.mongodb.net/test?retryWrites=true&w=majority&useNewUrlParser=true&useUnifiedTopology=true"

//   const client = new MongoClient(uri);

//   try {
//      await client.connect();

//      await listDatabases(client);

//   } catch (e) {
//      console.error(e);
//   } finally {
//      await client.close();
//   }
//}

//main().catch(console.error);




//MongoClient.connect("mongodb+srv://nik0:11X8sv77mc04yyP4@10.0.0.10/viralBear?retryWrites=true&w=majority", function (err, db) {
//   console.log('djuidjgjkdfj')
//   if (!err) {
//      console.log("You are connected!");
//   };
//   db.close();
//});



