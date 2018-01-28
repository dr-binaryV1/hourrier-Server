const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const router = require('./router');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.static(`${__dirname}/build`));

mongoose.connect('mongodb://dr-binaryV1:Diamond0000@ds241875.mlab.com:41875/heroku_jb6hhdns', {
  useMongoClient: true
});
// mongoose.connect('mongodb://localhost:27017/hourrier', {
//   useMongoClient: true
// });
mongoose.Promise = global.Promise;

app.use(morgan('combined'));
app.use(bodyParser.json({limit: '50mb'}));

const corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

// const sslOptions = {
//   key: fs.readFileSync('key.pem'),
//   cert: fs.readFileSync('cert.pem'),
//   passphrase: 'DamianW1234'
// };

app.use(cors(corsOptions));
router(app);

const port = process.env.PORT || 3090;
const server = http.createServer(app);

server.listen(port);
console.log('server listening on port: ', port);
