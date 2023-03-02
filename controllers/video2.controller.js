
const Video2 = require('../video2/Video2')

const { generateVideoId } = require('../utils/generateVideoId')
const cloudConfig = require('../yandex-cloud.config')
const moment = require("moment")

const path = require('path')
const fs = require('fs')


const { findWorkerEmailByWorkerName } = require('../utils/findWorkerEmailByWorkerName')
const { exportsVideoToExcel } = require('../utils/exportsVideoToExcel')


const filePath2 = path.join(__dirname, "..", "/localstorage", "localstorage.txt");






const addVideo = async (req, res) => {
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
            var bucketRequest = await cloudConfig.Upload(
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
            researchers: await findWorkerEmailByWorkerName(decodeResearchers),
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
}

const generateExcelFile = async (req, res) => {

   const { range } = req.body


   let listVideo = [];
   for (u of range) {
      const video = await Video2.findOne({ "videoData.videoId": +u });
      if (video) {
         listVideo.push(u);
      }
   }

   if (listVideo.length === 0) {
      res.set('Content-Type', 'application/json');
      res.status(200).json({ message: "Videos with the id of this range were not found" })
      return
   }

   let dataFromFoundVideo = [];

   for (i of listVideo) {
      const video = await Video2.findOne({ "videoData.videoId": +i });

      let objectExcel = {
         id: video.videoData.videoId,
         title: video.videoData.title,
         videoLink: video.videoData.originalVideoLink,
         story: video.videoData.description,
         date: video.videoData.date,
         city: video.videoData.city,
         country: video.videoData.country,
         keywords: video.videoData.tags.toString(),
      };
      dataFromFoundVideo.push(objectExcel);
   }

   const columnList = [
      "ID",
      "TITLE",
      "VideoLink",
      "STORY",
      "DATE",
      "CITY",
      "COUNTRY",
      "KEYWORDS",
   ];

   const workSheetName = "Videos";
   const filePathExcel = path.join(__dirname, "..", "excel", "data.xlsx");


   exportsVideoToExcel(dataFromFoundVideo, columnList, workSheetName, filePathExcel);


   setTimeout(() => {
      fs.writeFile(filePath2, ``, (err) => {
         if (err) {
            throw err;
         } else {
            console.log("Удалено");
         }
      });
   }, 2000);

   res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
   res.status(200).download(path.resolve(__dirname, "..", "excel", "data.xlsx"));
}

const findLastVideo = async (req, res) => {
   try {
      const lastAddedVideo = await Video2.findOne({ isApproved: false })
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
}

const findByNotApproved = async (req, res) => {
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
}

const findByIsBrandSafe = async (req, res) => {
   try {
      const videos = await Video2.find({
         brandSafe: true,
         isApproved: true
      }, { _id: false, __v: false, updatedAt: false })

      res.status(200).json(videos);
   } catch (err) {
      console.log(err);
      throw Error("Server side error...");
   }
}

const findByFixed = async (req, res) => {
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
}

const findById = async (req, res) => {
   try {

      const { id } = req.params

      const video = await Video2.findOne({ "videoData.videoId": +id })


      if (!video) {
         res.status(200).json({ message: `Video with id "${id}" was not found` })
         return
      }

      //if (video.isApproved === true) {
      //   res.status(200).json({ message: `This video has already been published` })
      //   return
      //}

      const { _id, __v, updatedAt, ...data } = video._doc

      res.status(200).json(data)

   } catch (err) {
      console.log(err);
      throw Error("database error");
   }
}

const updateVideo = async (req, res) => {
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

               await cloudConfig.Remove(video.bucket.cloudVideoPath)

               var bucketRequest = await cloudConfig.Upload(
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

               await cloudConfig.Remove(video.bucket.cloudScreenPath)

               var bucketRequest = await cloudConfig.Upload(
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

               await cloudConfig.Remove(video.bucket.cloudScreenPath)
               await cloudConfig.Remove(video.bucket.cloudVideoPath)

               var bucketRequest = await cloudConfig.Upload(
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
            "trelloData.researchers": researchers && await findWorkerEmailByWorkerName(JSON.parse(researchers)),
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
}

const fixedVideo = async (req, res) => {
   console.log(req.body)
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

               await cloudConfig.Remove(video.bucket.cloudVideoPath)

               var bucketRequest = await cloudConfig.Upload(
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

               await cloudConfig.Remove(video.bucket.cloudScreenPath)

               var bucketRequest = await cloudConfig.Upload(
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

               await cloudConfig.Remove(video.bucket.cloudScreenPath)
               await cloudConfig.Remove(video.bucket.cloudVideoPath)

               var bucketRequest = await cloudConfig.Upload(
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
            "trelloData.researchers": researchers && await findWorkerEmailByWorkerName(JSON.parse(researchers)),
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
}

const addCommentForFixed = async (req, res) => {
   console.log(req.body, 5743846746)
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
}

const publishingVideo = async (req, res) => {
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
}

const deleteVideo = async (req, res) => {
   try {

      const { id } = req.params

      const video = await Video2.findOne({ "videoData.videoId": +id })


      if (!video) {
         res.status(200).json({ message: `Video with id "${id}" was not found` })
         return
      }
      try {
         await cloudConfig.Remove(video.bucket.cloudScreenPath)
         await cloudConfig.Remove(video.bucket.cloudVideoPath)
      } catch (err) {
         console.log(err)
         return res.status(500).json({ message: "Error when deleting videos from yandex cloud!" })
      }

      await Video2.deleteOne({ "videoData.videoId": +id })

      res.status(200).json({ trelloCardId: video.trelloData.trelloCardId })

   } catch (err) {
      console.log(err);
      throw Error("Server-side error...");
   }
}




module.exports = {
   addVideo,
   findLastVideo,
   findByNotApproved,
   findByIsBrandSafe,
   findByFixed,
   findById,
   updateVideo,
   fixedVideo,
   addCommentForFixed,
   publishingVideo,
   deleteVideo,
   generateExcelFile
}