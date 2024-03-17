const express = require('express');
const app = express();
const port = 3000;
const mongoose = require('mongoose');
const cors= require('cors');
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose.connect('mongodb+srv://Zohaib24648:Zohaib24648@userlogins.94nzbbm.mongodb.net/').then (() => {
    console.log('Connected to the Database');})
    .catch((err) => {
        console.log('Not Connected to the Database : ' + err);
    });
    
//importing routes from other files
