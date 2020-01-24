// importing dependencies
require('dotenv').config()
const express = require('express');
const routes = require('./routes/routes');
var bodyParser = require('body-parser')
const cors = require('cors');


const app = express();

// support cors
app.use(cors());

// support parsing of application/json type post data
app.use(bodyParser.json());

//support parsing of application/x-www-form-urlencoded post data
app.use(bodyParser.urlencoded({ extended: true }));


// setting up the routes
app.use('/api', routes);


// creating the port to run on
const port = process.env.PORT || 3000;

app.listen(port, () => console.log(`backend on port ${port}!`));