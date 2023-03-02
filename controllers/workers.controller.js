

const Workers = require('../workers/Workers')


const getAllWorkers = async (req, res) => {
   try {
      const workers = await Workers.find({});
      res.status(200).json(workers);
   } catch (err) {
      console.log(err)
   }

}


module.exports = {
   getAllWorkers
}