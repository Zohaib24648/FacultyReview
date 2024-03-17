const express = require('express');
const app = express();
const port = 3001;
const mongoose = require('mongoose');
const cors = require('cors');
app.use(cors());
const mainRouter = require('./modules'); // This imports the aggregated router from your modules folder
app.use('/', mainRouter); // Correctly use the imported router

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose.connect('mongodb+srv://Zohaib24648:Zohaib24648@userlogins.94nzbbm.mongodb.net/').then (() => {
    console.log('Connected to the Database');
    app.listen(port, () => console.log(`Server is running on port ${port}`));
})
    .catch((err) => {
        console.log('Not Connected to the Database : ' + err);

    });

//importing routes from other files
