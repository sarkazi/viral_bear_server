
const Video2 = require('../video2/Video2')


const generateVideoId = async () => {
   try {
      const lastAddedVideo = await Video2.findOne({})
         .sort({ createdAt: -1 })
         .limit(1)

      if (!lastAddedVideo) {
         return 1
      } else {
         const videoId = lastAddedVideo.videoData.videoId
         return Number(videoId) + 1
      }



   } catch (err) {
      console.log(err)
   }
}


module.exports = { generateVideoId }