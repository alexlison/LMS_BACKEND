const mongoose = require('mongoose')
const express = require('express')
const cors = require('cors')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const multer = require('multer')
const path = require('path')
const studentModel = require('./models/Student')
const bookModel = require('./models/Books')
const bookAssignModel = require('./models/BookAssign')



const app = express()
app.use(express.json())
app.use(cors())
app.use(express.urlencoded({ extended: true }))

mongoose.connect("mongodb+srv://alexlison:alexlison6885@cluster0.bz3d6.mongodb.net/LMS_DB?retryWrites=true&w=majority&appName=Cluster0")


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        return cb(null, "./uploads");
    },
    filename: (req, file, cb) => {
        return cb(null, Date.now() + "-" + file.originalname);

    }
})

const upload = multer({ storage })

app.use("/uploads", express.static("uploads"));




app.post('/login', async (req, res) => {

    const inputData = req.body

    await studentModel.find({ email: inputData.email }).then(
        (result) => {
            if (result.length > 0) {
                passwordValidator = bcrypt.compareSync(inputData.password, result[0].password)

                if (passwordValidator) {
                    jwt.sign({ email: result[0].email, role: result[0].role }, 'LMSTOKEN', { expiresIn: '1d' },
                        (error, token) => {
                            if (error) {
                                res.json({ "Status": 'TokenCreationError' })
                            } else {
                                res.json({ "Status": "Success", token, "userId": result[0]._id, "role": result[0].role })
                            }
                        }
                    )
                } else {
                    res.json({ "Status": "IncorrectPassword" })
                }
            } else {
                res.json({ "Status": "EmailNotFound" })
            }
        }
    ).catch(
        (err) => {
            res.json({ "Status": "Error" })
            console.log("Error -->", err)
        }
    )
})


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


app.post('/viewStudents', async (req, res) => {
    const token = req.headers.token

    jwt.verify(token, 'LMSTOKEN', async (error, decoded) => {

        if (decoded.role !== "admin") {

            return res.json({ "Status": "Unauthorized" });
        }

        if (decoded) {
            await studentModel.find({ role: "student" }).then(
                (items) => {

                    res.json({ "Status": "Success", data: items })
                }
            ).catch(
                (err) => {
                    console.log('Error -> ', err)
                    res.json({ "Status": "Error" })
                }
            )
        } else {
            res.json({ "Status": "InvalidAuthentication" })
        }
    })
})

app.post('/addBook', upload.single("image"), async (req, res) => {

    try {

        const input = req.body
        const token = req.headers.token

        jwt.verify(token, 'LMSTOKEN', async (error, decoded) => {

            if (error || !decoded) {
                return res.json({ Status: "InvalidAuthentication" });
            }

            if (decoded.role !== 'admin') {
                return res.json({ "Status": "Unathorized" })
            }

            if (decoded) {
                const existingBook = await bookModel.findOne({ title: input.title, author: input.author })

                if (existingBook) {
                    return res.json({ "Status": "BookAlreadyExists" })
                }

                const newBook = new bookModel({
                    title: input.title,
                    author: input.author,
                    image: req.file.path,
                    isIssued: false
                });

                await newBook.save()
                return res.json({ "Status": "Success" })
            }

        })

    } catch (err) {

        console.log("Error ->", err)
        return res.json({ "Status": "Error" })

    }
})


app.post("/viewBooks", async (req, res) => {


    const token = req.headers.token

    jwt.verify(token, 'LMSTOKEN', async (error, decoded) => {

        if (error || !decoded) {
            return res.json({ 'Status': "InvalidAuthentication" })
        }

        if (decoded.role !== 'admin' && decoded.role !== 'teacher') {
            return res.json({ "Status": "Unathorized" })

        }

        if (decoded) {
            await bookModel.find().then((items) => {

                res.json({ "Status": "Success", data: items })
            }).catch(
                (err) => {
                    console.log('Error -> ', err)
                    res.json({ "Status": "Error" })
                }
            )
        }
    });
});


app.post("/bookAssign", async (req, res) => {

    const { bookId, studentId } = req.body
    const token = req.headers.token

    jwt.verify(token, 'LMSTOKEN', async (error, decoded) => {

        if (error || !decoded) {
            return res.json({ "Status": "InvalidAuthentication" })
        }

        if (decoded.role !== 'admin') {
            return res.json({ "Status": "Unauthorized" })
        }

        const book = await bookModel.findById(bookId)
        if (!book) {
            return res.json({ "Status": "BookIdNotFound" })
        }

        if (book.isIssued) {
            return res.json({ "Status": "BookAlreadyAssigned" })
        }

        const assign = new bookAssignModel({
            bookId,
            studentId,
            status: "Assigned"
        })

        await assign.save()
        await bookModel.findByIdAndUpdate(bookId, { isIssued: true })

        return res.json({ "Status": "Success" })
    })
})


app.post('/getBookTitle/:id', async (req, res) => {

    const bookId = req.params.id

    const book = await bookModel.findById(bookId)

    if (!book) {
        return res.json({ "Status": "BookIdNotFound" })
    }

    res.json({ "Status": "Success", data: { title: book.title } })

})

app.post('/viewAllBooks', async (req, res) => {

    const token = req.headers.token

    jwt.verify(token, 'LMSTOKEN', async (error, decoded) => {

        if (error || !decoded) {
            return res.json({ 'Status': "InvalidAuthentication" })
        }

        if (decoded) {
            await bookModel.find().then((items) => {

                res.json({ "Status": "Success", data: items })
            }).catch(
                (err) => {
                    console.log('Error -> ', err)
                    res.json({ "Status": "Error" })
                }
            )
        }
    });
})


app.post('/mybooks', async (req, res) => {

    const { studentId } = req.body
    const token = req.headers.token

    jwt.verify(token, 'LMSTOKEN', async (error, decoded) => {

        if (error || !decoded) {
            return res.json({ "Status": "InvalidAuthentication" })
        }

        try {

            const mybooks = await bookAssignModel.find({ studentId: studentId, status: "Assigned" }).populate("bookId")

            if (mybooks.length === 0) {
                return res.json({ "Status": "NoBooks" })
            }

            res.json({ "Status": "Success", data: mybooks })

        } catch (err) {
            console.log("Error-->", err)
            res.json({ "Status": "Error" })

        }

    })
})

app.post('/returnBook', async (req, res) => {

    const { bookId } = req.body
    const token = req.headers.token

    jwt.verify(token, 'LMSTOKEN', async (error, decoded) => {

        if (!decoded || error) {
            return res.json({ "Status": "InvalidAuthentication" })
        }

        try {

            await bookAssignModel.findOneAndUpdate(
                { bookId },
                { status: "Returned" }
            );

            await bookModel.findByIdAndUpdate(bookId, {
                isIssued: false
            });

            res.json({"Status":"Success"})




        } catch (err) {

            res.json({ Status: "Error" });
        }
    })
})


app.post("/addTeacher", async (req, res) => {
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

            const existingTeacher = await studentModel.findOne({
                email: inputData.email,
            });

            if (existingTeacher) {
                return res.json({ "Status": "EmailAlreadyExists" });
            }

            const hashedPassword = bcrypt.hashSync(inputData.password, 10);
            inputData.password = hashedPassword;

            const newTeacher = new studentModel({
                name:inputData.email,
                email:inputData.email,
                subject:inputData.subject,
                department:inputData.department,
                role:"teacher",
                password:inputData.password
            });
            await newTeacher.save();

            return res.json({ "Status": "Success" });
        });
    } catch (err) {
        console.log("Error -->", err);
        return res.json({ "Status": "Error" });
    }
});

app.post("/viewTeacherBooks", async (req, res) => {


    const token = req.headers.token

    jwt.verify(token, 'LMSTOKEN', async (error, decoded) => {

        if (error || !decoded) {
            return res.json({ 'Status': "InvalidAuthentication" })
        }

        if (decoded.role !== 'teacher') {
            return res.json({ "Status": "Unathorized" })

        }

        if (decoded) {
            await bookModel.find().then((items) => {

                res.json({ "Status": "Success", data: items })
            }).catch(
                (err) => {
                    console.log('Error -> ', err)
                    res.json({ "Status": "Error" })
                }
            )
        }
    });
});

app.post("/borrowBook", async (req, res) => {

    const { bookId, studentId } = req.body;
    const token = req.headers.token;

    jwt.verify(token, "LMSTOKEN", async (err, decoded) => {

    

        try {
            const book = await bookModel.findById(bookId);

            if (book.isIssued) {
                return res.json({ Status: "AlreadyIssued" });
            }

            await bookModel.findByIdAndUpdate(bookId, {
                isIssued: true
            });

            const assign = new bookAssignModel({
                bookId,
                studentId,
                status: "Assigned"
            });

            await assign.save();

            res.json({ Status: "Success",assign });

        } catch (error) {
            console.log(error);
            res.json({ Status: "Error" });
        }
    });
});


app.listen(4000, () => {
    console.log('Server Running at port 4000');
})

