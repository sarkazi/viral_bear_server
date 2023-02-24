const { Schema, model } = require("mongoose")
const schema = new Schema({
   videoData: {
      videoId: {
         type: Number,
         required: true
      },
      title: {
         type: String,
         required: true
      },
      description: {
         type: String,
         required: true
      },
      creditTo: {
         type: String,
         required: false,
      },
      tags: {
         type: [String],
         required: true
      },
      category: {
         type: String,
         required: true
      },
      city: {
         type: String,
         required: true
      },
      country: {
         type: String,
         required: true
      },
      date: {
         type: String,
         required: true
      },
      originalVideoLink: {
         type: String,
         required: true
      },
      type: Object,
      required: true
   },
   trelloData: {
      trelloCardUrl: {
         type: String,
         required: true
      },
      trelloCardName: {
         type: String,
         required: true
      },
      trelloCardId: {
         type: String,
         required: true
      },
      researchers: {
         type: [String],
         required: true
      },
      priority: {
         type: Boolean,
         required: true
      },
      type: Object,
      required: true
   },
   bucket: {
      cloudVideoLink: {
         type: String,
         required: true
      },
      cloudScreenLink: {
         type: String,
         required: true
      },
      cloudVideoPath: {
         type: String,
         required: true
      },
      cloudScreenPath: {
         type: String,
         required: true
      },
   },
   needToBeFixed: {
      comment: {
         type: String,
         required: false
      },
      type: Object,
      required: false,
   },
   uploadData: {
      agreementLink: {
         type: String,
         required: false
      },
      vbCode: {
         type: String,
         required: false
      },
      authorEmail: {
         type: String,
         required: false,
      },
      advancePayment: {
         type: Number,
         required: false
      },
      percentage: {
         type: Number,
         required: false,
      },
      whereFilmed: {
         type: String,
         required: false,
      },
      whyDecide: {
         type: String,
         required: false,
      },
      whatHappen: {
         type: String,
         required: false,
      },
      whenFilmed: {
         type: String,
         required: false,
      },
      whoAppears: {
         type: String,
         required: false,
      },
   },
   brandSafe: {
      type: Boolean,
      required: true,
      default: false
   },
   isApproved: {
      type: Boolean,
      required: true,
      default: false
   },
   mRSS: {
      type: String,
      required: false,
   },
   mRSS2: {
      type: String,
      required: false,
   },
}, { timestamps: true })
module.exports = model('Video2', schema)