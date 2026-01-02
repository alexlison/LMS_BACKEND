const mongoose = require('mongoose')

const bookSchema = new mongoose.Schema(
    {
        title : {type : String,required : true},
        author : {type : String,required : true},
        image : {type : String,required : true},
        isIssued : {type : Boolean, default: false},
    }
)

const bookModel = mongoose.model("Books",bookSchema)
module.exports = bookModel