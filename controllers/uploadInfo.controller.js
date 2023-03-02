const UploadInfo = require('../uploadInfo/UploadInfo')

const findById = async (req, res) => {

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
}



module.exports = { findById }
