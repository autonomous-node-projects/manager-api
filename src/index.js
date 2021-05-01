// Environment
require('dotenv').config({
  path: `env/.env.${process.env.NODE_ENV}`,
});

// Express
const express = require('express');
const fileUpload = require('express-fileupload');

const app = express();

// Common
const { Log } = require('@autonomous-node-projects/tools');

// Routes
const intervals = require('routes/intervals');
const projects = require('routes/projects');
const output = require('routes/output');
const processes = require('routes/processes');
const schedules = require('routes/schedules');

// Other
const bootScheduled = require('./bootScheduled');

if (process.env.NODE_ENV === 'dev') {
  Log.warn(`Running as ${process.env.NODE_ENV}`);
}

app.use(express.urlencoded({
  extended: true,
}));

app.use(express.json());
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: process.env.TMP_FILES,
}));

//
// Routes
//
app.get('/ping', (req, res) => {
  res.status(200).send({
    data: 'Pong',
  });
});
app.use(intervals);
app.use(projects);
app.use(output);
app.use(processes);
app.use(schedules);

//
// On start - run scheduler for each project in db
//
bootScheduled();

//
// Serve
//
app.listen(process.env.API_PORT);
Log(`Listening at http://localhost:${process.env.API_PORT}`);
