const { Schema, model, now } = require("mongoose")
const schema = new Schema({

   name: {
      type: String,
      required: true
   },
   lastName: {
      type: String,
      required: true,
   },
   email: {
      type: String,
      required: true
   },
   videoLinks: {
      type: [String],
      required: true,

   },
   didYouRecord: {
      type: Boolean,
      required: true
   },
   operator: {
      type: String,
      required: false
   },
   over18YearOld: {
      type: Boolean,
      required: true
   },
   agreedWithTerms: {
      type: Boolean,
      required: true
   },
   didNotSubmitAnywhere: {
      type: Boolean,
      required: true
   },
   didNotGiveRights: {
      type: Boolean,
      required: true
   },
   ip: {
      type: String,
      required: true
   },
   formId: {
      type: String,
      required: true,
   },
   agreementLink: {
      type: String,
      default: ''
   },
   whereFilmed: {
      type: String,
      required: false
   },

   whenFilmed: {
      type: String,
      required: false
   },
   whoAppears: {
      type: String,
      required: false
   },
   whyDecide: {
      type: String,
      required: false
   },
   whatHappen: {
      type: String,
      required: false
   },
   advancePayment: {
      type: Number,
      required: false
   },
   percentage: {
      type: Number,
      required: false
   },
   researcher: {
      type: String,
      required: false
   },

}, { timestamps: { createdAt: 'submittedDate' } })




module.exports = model('UploadInfo', schema)