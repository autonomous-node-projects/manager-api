// Express
const express = require('express');

module.exports = express();
const app = module.exports;

// Common
const { Log } = require('@autonomous-node-projects/tools');
const Response = require('common/responseCreator');

// Mongo
require('common/database/db');
const Projects = require('common/database/models/projects');

// Processes
const {
  spawnProcess,
  listOfProcesses,
  killProcess,
} = require('common/processesManagment');

//
// Run once endpoint
//
app.post('/processes/run_once', async (req, res) => {
  const project = await Projects.findById(req.query.id);
  Log(req.query.id);
  const processId = spawnProcess(req.body.scriptName, project.name);
  Response.success(res, {
    status: 200,
    data: {
      details: `started ${req.body.scriptName} in ${project.name} marked with Id: ${processId}`,
    },
  });
});

//
// Delete running process
//
app.delete('/processes', async (req, res) => {
  const result = killProcess(req.query.id);
  if (result) {
    Response.success(res, {
      status: 200,
      data: {
        details: 'Killed process successfully',
      },
    });
  } else {
    Response.error(res, {
      status: 400,
      data: {
        details: 'Couldnt kill process',
      },
    });
  }
});

//
// Get processes running
//
app.get('/processes', async (req, res) => {
  const proccessesListPure = listOfProcesses().map((processData) => ({
    id: processData.id,
    projectName: processData.projectName,
    scriptName: processData.scriptName,
  }));
  Response.success(res, {
    status: 200,
    data: {
      details: 'List of all running processes', data: proccessesListPure,
    },
  });
});
