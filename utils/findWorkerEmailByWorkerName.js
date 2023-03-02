const Workers = require('../workers/Workers')



const findWorkerEmailByWorkerName = async (decodeResearchers) => {

   const workers = await Workers.find({})

   const workersEmailsList = decodeResearchers.map(el => {
      const nameRespond = workers.find(worker => worker.nameOfWorker === el)
      return nameRespond.email
   }).filter(el => el)

   return workersEmailsList
}



module.exports = { findWorkerEmailByWorkerName }