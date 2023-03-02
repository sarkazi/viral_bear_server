const{Schema, model} = require("mongoose")
const schema=new Schema({
    
        email:{
              type:String
        },
        password:{
            type:String
        },
        nameOfWorker:{
            type:String
        },
        nickOfWorker:{
            type:String
        }
      
})
module.exports=model('Workers',schema)