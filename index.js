const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const router = require('./router');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

mongoose.connect('mongodb://localhost:hourrier');

app.use(morgan('combined'));
app.use(bodyParser.json({ type: '*/*'}));

var corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204 
}

app.use(cors(corsOptions));
router(app);

const port = process.env.PORT || 3090;
const server = http.createServer(app);

server.listen(port);
console.log('server listening on port: ', port);
