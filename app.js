const express = require("express");
const cors = require("cors");
require('dotenv').config();
const port = process.env.PORT || 3000;

const app = express();

app.use(cors({
    origin: "*"
}));
//body parser middleware
app.use(express.urlencoded({ extended: false, limit: "20mb" }));
app.use(express.json({ limit: "20mb" }));
//importing routes
const servus = require('./routes/pdf.route');

const user = require('./routes/user.route');

app.use('/pdf', servus);

app.use('/user', user);

app.get("/", (req, res) => {
    res.send(`OK`);
});

app.use((err, req, res, next) => {
    res.status(500).json({
        error: true,
        details: err
    })
});


app.listen(port, () => {
    console.log(`app is running on port ${port}`);
}).on('error', function(err) {
    console.log("Sowething Went Worng",err);
});