const express = require('express')
const router = express.Router()
const { findById } = require('../controllers/uploadInfo.controller')


router.get("/findOne/:id", findById);


module.exports = router