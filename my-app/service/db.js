const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const app = new express();
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded// 连接数据库
mongoose.connect('mongodb://localhost/stopdata1');
mongoose.connection
        .on('open',function () {
            console.log('数据库连接成功'); 
     })    
        .on('error',function () {
            
             console.log('数据库连接失败');    
    });

