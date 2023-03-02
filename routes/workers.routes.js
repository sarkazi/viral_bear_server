const express = require('express')
const router = express.Router()


const { getAllWorkers } = require('../controllers/workers.controller')


router.get("/getAll", getAllWorkers);


module.exports = router