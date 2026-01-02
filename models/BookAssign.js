const mongoose = require('mongoose')

const bookAssignSchema = new mongoose.Schema(
    {
        bookId : {type : mongoose.Schema.Types.ObjectId, ref : "Books",required : true},
        studentId : {type : mongoose.Schema.Types.ObjectId, ref : "Students", required : true},
        status : {type : String, enum : ["Assigned","Returned"] ,required : true}

    }
)

const bookAssignModel = mongoose.model("bookAssigns",bookAssignSchema)
module.exports = bookAssignModel