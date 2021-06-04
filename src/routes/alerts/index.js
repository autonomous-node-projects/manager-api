const Response = require('services/responseCreator');
const Alerts = require('database/models/alerts');

const checkSchema = require('services/schemaChecker');
const { jsonSchema: postBodyJSON, openAPISchema: postBodyOpenAPI } = require('./schema/post/body.schema');
require('database/db');

const GET = async (req, res) => {
  let docs;
  const projection = {
  };
  if (!req.query.projectName) {
    docs = await Alerts.find({
    }, projection)
      .skip(Number(req.query.offset))
      .limit(Number(req.query.limit));
  } else {
    const projectName = req.query.projectName.split(',');
    docs = await Alerts.find({
      projectName,
    }, projection)
      .skip(Number(req.query.offset))
      .limit(Number(req.query.limit));
  }
  Response.success(res, {
    status: 201,
    data: {
      details: 'List of alerts',
      data: docs,
    },
  });
};

const POST = async (req, res) => {
  const { body } = req;

  // Get schemas
  const schemas = {
    body: postBodyJSON,
  };

  const schemaResult = {
    body: checkSchema(schemas.body, req.body),
  };

  if (schemaResult.body.error) {
    Response.error(res, {
      status: 500, data: schemaResult.body.error,
    });
    return;
  }

  const alerts = body.map((alert) => ({
    ...alert, alertCreationDate: new Date().getTime(),
  }));
    // Add entries to mongoDB
  Alerts.insertMany(alerts, (err, doc) => {
    if (err) {
      Response.error(res, {
        status: 500,
        data: {
          details: 'Unable to save alerts to database',
        },
      });
    } else {
      Response.success(res, {
        status: 201,
        data: {
          details: 'Saved alerts in database', data: doc,
        },
      });
    }
  });
};

// DOCUMENTATION

GET.apiDoc = {
  summary: 'Get alerts.',
  operationId: 'getAlerts',
  tags: [
    __dirname.split(/[\\/]/).pop(),
  ],
  parameters: [
    {
      in: 'query',
      name: 'id',
      type: 'string',
      description: 'Filter by projects IDs',
    },
    {
      in: 'query',
      name: 'limit',
      type: 'string',
      description: 'Adds limit to queried alerts',
    },
    {
      in: 'query',
      name: 'offset',
      type: 'string',
      description: 'Adds offset to queried alerts',
    },
  ],
  responses: {
    200: {
      description: 'Get array of alerts.',
    },
  },
};

POST.apiDoc = {
  summary: 'Add alerts.',
  operationId: 'addAlerts',
  tags: [
    __dirname.split(/[\\/]/).pop(),
  ],
  consumes: ['application/json'],
  parameters: [{
    in: 'body',
    name: 'alerts',
    schema: postBodyOpenAPI,
  }],
  responses: {
    200: {
      description: 'Added alerts.',
    },
    400: {
      description: 'Couldnt add all alerts',
    },
  },
};

const operations = {
  GET,
  POST,
};

module.exports = operations;
