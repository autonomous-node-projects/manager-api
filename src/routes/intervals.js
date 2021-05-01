// Express
const express = require('express');

module.exports = express();
const app = module.exports;

// Common
const Response = require('common/responseCreator');

// Mongo
require('common/database/db');

// Processes
const {
  listOfIntervals,
  killInterval,
} = require('common/processesManagment');

// Get intervals running
app.get('/intervals', async (req, res) => {
  const intervalsListPure = listOfIntervals();
  Response.success(res, {
    status: 200,
    data: {
      details: 'List of all running intervals', data: intervalsListPure,
    },
  });
});

// Delete running intervals
app.delete('/intervals', async (req, res) => {
  const results = req.query.id.map((id) => killInterval(id));
  if (results) {
    Response.success(res, {
      status: 200,
      data: {
        details: 'Killed interval successfully', data: results,
      },
    });
  } else {
    Response.error(res, {
      status: 400,
      data: {
        details: 'Couldnt kill interval', data: results,
      },
    });
  }
});
