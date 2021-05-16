require('dotenv').config({
  path: `env/.env.${process.env.NODE_ENV}`,
});
const { Log } = require('@autonomous-node-projects/tools');

const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const bootScheduled = require('services/bootScheduled');

const { initialize } = require('express-openapi');
const swaggerUi = require('swagger-ui-express');
const openapiDocument = require('./documentation/api-doc');

if (process.env.NODE_ENV === 'dev') {
  Log.warn(`Running as ${process.env.NODE_ENV}`);
}

const app = express();

// Cors
app.use(cors());

// Load schedules
bootScheduled();

// Parsing
app.use(express.urlencoded({
  extended: true,
}));
app.use(express.json());
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: process.env.TMP_FILES,
}));

// Documentation
initialize({
  app,
  apiDoc: openapiDocument,
  paths: 'src/routes',
  promiseMode: true,
});

const docsUrl = '/swagger';
app.use(
  docsUrl,
  swaggerUi.serve,
  swaggerUi.setup(null, {
    swaggerOptions: {
      url: 'http://localhost:3000/api-docs',
    },
  }),
);

app.listen(process.env.API_PORT);
Log(`Listening at http://localhost:${process.env.API_PORT}`);
Log(`OpenAPI (swagger UI) documentation available at http://localhost:${process.env.API_PORT}${docsUrl}`);
Log(`OpenAPI (raw JSON) documentation available at http://localhost:${process.env.API_PORT}/api-docs`);
