const { Log } = require('@autonomous-node-projects/tools');
const Response = require('services/responseCreator');

require('database/db');
const Projects = require('database/models/projects');

const {
  spawnProcess,
  listOfProcesses,
  killProcess,
} = require('services/processesManagment');

const POST = async (req, res) => {
  const project = await Projects.findById(req.query.id);
  Log(req.query.id);
  const processId = spawnProcess(req.query.scriptName, project.name);
  Response.success(res, {
    status: 200,
    data: {
      details: `started ${req.body.scriptName} in ${project.name} marked with Id: ${processId}`,
    },
  });
};

const GET = async (req, res) => {
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
};

const DELETE = async (req, res) => {
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
};

POST.apiDoc = {
  summary: 'Spawn single process.',
  operationId: 'spawnProcesses',
  consumes: ['application/json'],
  tags: [
    __dirname.split(/[\\/]/).pop(),
  ],
  parameters: [{
    in: 'query',
    name: 'id',
    required: true,
    description: 'ID of project to be spawned',
    type: 'string',
  },
  {
    in: 'query',
    name: 'scriptName',
    required: true,
    description: 'Script name from project to be spawned',
    type: 'string',
  }],
  responses: {
    200: {
      description: 'Started new scripts',
    },
  },
};

GET.apiDoc = {
  summary: 'Get running processes array.',
  operationId: 'getProcesses',
  consumes: ['application/json'],
  tags: [
    __dirname.split(/[\\/]/).pop(),
  ],
  responses: {
    200: {
      description: 'Array of running scripts',
    },
  },
};

DELETE.apiDoc = {
  summary: 'Delete running processes array.',
  operationId: 'killProcess',
  consumes: ['application/json'],
  tags: [
    __dirname.split(/[\\/]/).pop(),
  ],
  parameters: [{
    in: 'query',
    name: 'id',
    required: true,
    type: 'string',
  }],
  responses: {
    200: {
      description: 'Array of running scripts',
    },
    400: {
      description: 'Couldnt find scripts to be killed',
    },
  },
};

const operations = {
  POST,
  GET,
  DELETE,
};

module.exports = operations;
