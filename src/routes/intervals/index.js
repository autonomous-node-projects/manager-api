const Response = require('services/responseCreator');

require('database/db');

const {
  listOfIntervals,
  killInterval,
} = require('services/processesManagment');

const GET = async (req, res) => {
  const intervalsListPure = listOfIntervals();
  Response.success(res, {
    status: 200,
    data: {
      details: 'Array of running intervals',
      data: intervalsListPure,
    },
  });
};

const DELETE = async (req, res) => {
  const results = req.query.id.split(',').map((id) => killInterval(id));
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
        details: 'Couldnt kill interval',
        data: results,
      },
    });
  }
};

// DOCUMENTATION

GET.apiDoc = {
  summary: 'Get all intervals.',
  operationId: 'getIntervals',
  tags: [
    __dirname.split(/[\\/]/).pop(),
  ],
  responses: {
    200: {
      description: 'Get array of running intervals.',
    },
  },
};

DELETE.apiDoc = {
  summary: 'Delete intervals by ID.',
  operationId: 'deleteIntervals',
  tags: [
    __dirname.split(/[\\/]/).pop(),
  ],
  consumes: ['application/json'],
  parameters: [
    {
      in: 'query',
      name: 'id',
      required: true,
      type: 'string',
      description: 'IDs of intervals',
    },
  ],
  responses: {
    200: {
      description: 'Deleted selected intervals.',
    },
    400: {
      description: 'Couldnt delete all selected intervals',
    },
  },
};

const operations = {
  GET,
  DELETE,
};

module.exports = operations;
