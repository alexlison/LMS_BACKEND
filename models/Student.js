const mongoose = require('mongoose')

const StudentSchema = new mongoose.Schema(
    {
        name : {type : String},
        rollNo : {type : String},
        email : {type : String},
        course : {type : String},
        department : {type :String},
        role:{type :String,},
        password : {type : String},
        subject : {type : String},

    }
)

const studentModel = mongoose.model("Students",StudentSchema)
module.exports = studentModel