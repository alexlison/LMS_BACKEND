const mongoose = require('mongoose')

const StudentSchema = new mongoose.Schema(
    {
        name : {type : String,required : true},
        rollNo : {type : String,required : true},
        email : {type : String,required : true},
        course : {type : String,required :true},
        department : {type :String,requred : true},
        role:{type :String,requred : true},
        password : {type : String,required : true}
    }
)

const studentModel = mongoose.model("Students",StudentSchema)
module.exports = studentModel