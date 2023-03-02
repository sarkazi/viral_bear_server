const express = require('express')
const router = express.Router()
const multer = require('multer')

const { addVideo,
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
} = require('../controllers/video2.controller')



const storage = multer.memoryStorage();


router.post("/addVideo",

   multer({ storage: storage }).fields([
      {
         name: "video",
         maxCount: 1
      },
      {
         name: "screen",
         maxCount: 1
      }
   ]), addVideo);

router.post("/generateExcelFile", generateExcelFile);

router.get("/findOne", findLastVideo);

router.get("/findByNotApproved", findByNotApproved);

router.get("/findByIsBrandSafe", findByIsBrandSafe);

router.get("/findByFixed", findByFixed);

router.get("/findOne/:id", findById);

router.patch("/update",

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

   updateVideo);

router.patch("/fixedVideo",

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

   fixedVideo);

router.patch("/addCommentForFixed", addCommentForFixed);

router.patch("/publishing/:id", publishingVideo);

router.delete("/delete/:id", deleteVideo);




module.exports = router