const express = require('express');
const app = express();
const fs = require("fs");
const multer = require('multer');
const {createWorker} = require('tesseract.js');
const worker = createWorker();

const storage = multer.diskStorage({
    destination: (req,file,cb) => {
        cb(null, "./uploads")
    },
    filename: (req,file,cb) => {
        cb(null, file.originalname);
    } 
});

const upload = multer({storage: storage}).single('avatar');
app.set("view engine", "ejs");
app.use(express.static("public"));
//ROUTES
app.get('/', (req,res) => {
    res.render('index')
})

app.post("/upload", (req,res) => {
    upload(req,res,err => {
        fs.readFile(`./uploads/${req.file.originalname}`, (err, image) => {
            (async () => {
                const worker = createWorker();
                await worker.load();
                await worker.loadLanguage('eng');
                await worker.initialize('eng');
                const { data: { text } } = await worker.recognize(image);
                console.log(text);
                const { data } = await worker.getPDF('Tesseract OCR Result');
                console.log('Generate PDF: tesseract-ocr-result.pdf');  
                await worker.terminate();
              })();
        });
    });
});

app.get('/download', (req,res) => {
    const file = `${__dirname}/tesseract-ocr-result.pdf`
    res.download(file);
})

//start up server
const PORT = 5000 || process.env.PORT;
app.listen(PORT, () => console.log(`Hey I'm running on port ${PORT}`))