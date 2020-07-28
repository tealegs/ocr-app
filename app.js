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
            if (err) return console.log("This is your error", err);
            ////old code from tutorial
            // worker
            //     .recognize(data, "eng", { tessjs_create_pdf: "1" })
            //     .progress(progress => {console.log(progress);})
            //     .then(result => {
            //         res.send(result.text);
            //         //res.redirect('/download')
            //     })
            //     .finally(() => worker.terminate());
            
            ////new code found from docs
            (async () => {
                const worker = createWorker();
                await worker.load();
                await worker.loadLanguage('eng');
                await worker.initialize('eng');
                const { data: { text } } = await worker.recognize(image);
                console.log(text);
                const { data } = await worker.getPDF('Tesseract OCR Result');
                fs.writeFileSync('tesseract-ocr-result.pdf', Buffer.from(data));
                //TODO - setup download of pdf
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

//APP THAT READS TEXT ON A SCREEN TO DISABLED PEOPLE (DYSLEXIC, BLIND, ETC)