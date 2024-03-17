const express = require('express');
const router = express.router();
const authRouter= require ('./auth');

router.use('/auth', authRouter);

module.exports =router;


