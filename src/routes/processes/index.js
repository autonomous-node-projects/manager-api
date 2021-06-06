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
  if (project) {
    const processesInformation = await req.query.scriptName.split(',').map((scriptName) => {
      if (Object.keys(project.scripts).includes(scriptName)) {
        const processId = spawnProcess(scriptName, project.name);
        return {
          scriptName,
          processId,
        };
      }
      return {
        scriptName,
        notFound: true,
      };
    });

    if (!processesInformation.find((processInfo) => Object.keys(processInfo).includes('notFound'))) {
      Response.success(res, {
        status: 201,
        data: {
          details: `started scripts in ${project.name}`,
          data: {
            ...processesInformation,
          },
        },
      });
    } else {
      Response.success(res, {
        status: 404,
        data: {
          details: `Couldnt find some scripts in ${project.name}`,
          data: {
            ...processesInformation,
          },
        },
      });
    }
  } else {
    Response.error(res, {
      status: 404,
      data: {
        details: `Couldnt find project with id ${req.query.id}`,
      },
    });
  }
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
  const processesResult = req.query.id.split(',').map((id) => killProcess(id));
  if (!processesResult.includes(false)) {
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
        details: 'Couldnt kill all processes',
      },
    });
  }
};

POST.apiDoc = {
  summary: 'Spawn multiple processes for single project.',
  operationId: 'spawnProcesses',
  consumes: ['application/json'],
  tags: [
    __dirname.split(/[\\/]/).pop(),
  ],
  parameters: [{
    in: 'query',
    name: 'id',
    required: true,
    description: 'ID of project with scripts which will be spawned',
    type: 'string',
  },
  {
    in: 'query',
    name: 'scriptName',
    required: true,
    description: 'Scripts names from project to be spawned',
    type: 'string',
  }],
  responses: {
    201: {
      description: 'Started new processes',
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
      description: 'Array of all running processes',
    },
  },
};

DELETE.apiDoc = {
  summary: 'Kill processes.',
  operationId: 'killProcess',
  consumes: ['application/json'],
  tags: [
    __dirname.split(/[\\/]/).pop(),
  ],
  parameters: [{
    in: 'query',
    name: 'id',
    required: true,
    description: 'Processes Ids to be killed',
    type: 'string',
  }],
  responses: {
    200: {
      description: 'Killed processes',
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
