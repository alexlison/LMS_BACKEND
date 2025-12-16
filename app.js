const mongoose = require('mongoose')
const express = require('express')
const cors = require('cors')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const multer = require('multer')
const path = require('path')
const studentModel = require('./models/Student')
const bookModel = require('./models/Books')


const app = express()
app.use(express.json())
app.use(cors())
app.use(express.urlencoded({extended:true}))

mongoose.connect("mongodb+srv://alexlison:alexlison6885@cluster0.bz3d6.mongodb.net/LMS_DB?retryWrites=true&w=majority&appName=Cluster0")


const storage = multer.diskStorage({
    destination : (req, file, cb) => {
        return cb(null,"./uploads");
    },
    filename : (req, file, cb) => {
        return cb(null, Date.now() + "-" + file.originalname);
        
    }
})

const upload = multer({storage})

app.use("/uploads", express.static("uploads"));




app.post('/login',async(req,res) => {
   
    const inputData = req.body
    
    await studentModel.find({email:inputData.email}).then(
        (result) => {
            if(result.length > 0)
            {
                passwordValidator = bcrypt.compareSync(inputData.password,result[0].password)

                if(passwordValidator)
                {
                    jwt.sign({email:result[0].email,role:result[0].role},'LMSTOKEN',{expiresIn:'1d'},
                        (error,token) => {
                            if(error)
                            {
                                res.json({"Status":'TokenCreationError'})
                            }else{
                                res.json({"Status":"Success",token,"userName":result[0].name,"role":result[0].role})
                            }
                        }
                    )
                }else{
                    res.json({"Status":"IncorrectPassword"})
                }
            }else{
                res.json({"Status":"EmailNotFound"})
            }
        }
    ).catch(
        (err) => {
            res.json({"Status":"Error"})
            console.log("Error -->",err)
        }
    )
} )


app.post("/addStudent", async (req, res) => {
  try {
    const inputData = req.body;
    const token = req.headers.token;

    jwt.verify(token, "LMSTOKEN", async (error, decoded) => {
      if (error || !decoded) {
        return res.json({ "Status": "InvalidAuthentication" });
      }

      if (decoded.role !== "admin") {
        return res.json({ "Status": "Unauthorized" });
      }

      const existingStudent = await studentModel.findOne({
        email: inputData.email,
      });

      if (existingStudent) {
        return res.json({ "Status": "EmailAlreadyExists" });
      }

      const hashedPassword = bcrypt.hashSync(inputData.password, 10);
      inputData.password = hashedPassword;

      const newStudent = new studentModel(inputData);
      await newStudent.save();

      return res.json({ "Status": "Success" });
    });
  } catch (err) {
    console.log("Error -->", err);
    return res.json({ "Status": "Error" });
  }
});


app.post('/viewStudents',async(req,res) => {
    const token = req.headers.token

    jwt.verify(token,'LMSTOKEN',async (error,decoded) => {

        if (decoded.role !== "admin") {

           return res.json({ "Status": "Unauthorized" });
        }

        if(decoded)
        {
            await studentModel.find({role : "student"}).then(
                (items) => {

                    res.json({"Status" : "Success",data : items})
                }
            ).catch(
                (err) => {
                    console.log('Error -> ',err)
                    res.json({"Status":"Error"})
                }
            )
        }else{
            res.json({"Status":"InvalidAuthentication"})
        }
    })
})

app.post('/addBook',upload.single("image"),async(req,res) => {

    try{

           const input = req.body
           const token = req.headers.token

           jwt.verify(token,'LMSTOKEN',async(error,decoded) => {

              if (error || !decoded) {
                  return res.json({ Status: "InvalidAuthentication" });
                }

               if(decoded.role !== 'admin')
               {
                   return res.json({"Status":"Unathorized"})
               }

                if(decoded)
                {
                    const existingBook = await bookModel.findOne({title : input.title,author : input.author })

                    if(existingBook)
                    {
                        return res.json({"Status":"BookAlreadyExists"})
                    }

                    const newBook = new bookModel({
                        title: input.title,
                        author: input.author,
                        image: req.file.path,
                        isIssued: false
                    });

                    await newBook.save()
                    return res.json({"Status":"Success"}) 
                }
    
            })
 
    }catch(err){

        console.log("Error ->",err)
        return res.json({"Status":"Error"})
        
    }
})


app.post("/viewBooks",async(req,res) => {

    const input = req.body
    const token = req.headers.token

    jwt.verify(token,'LMSTOKEN',async (error,decoded) => {

        if(error || !decoded)
        {
            return res.json({'Status':"InvalidAuthentication"})
        }

        if(decoded.role !== 'admin')
        {
            return res.json({"Status":"Unathorized"})

        }

        if(decoded)
        {
            await bookModel.find().then((items)=> {
                
                res.json({"Status":"Success",data:items})
            }).catch(
                   (err) => {
                    console.log('Error -> ',err)
                    res.json({"Status":"Error"})
                }
            )
        }
    });
});


app.listen(4000,() => {
    console.log('Server Running at port 4000');
})