const tar = require('tar-fs');
const fs = require('fs');

const { Log } = require('@autonomous-node-projects/tools');
const Response = require('services/responseCreator');

const { projectsFilesManager } = require('common/filesManagers');

require('database/db');
const Projects = require('database/models/projects');

const {
  installPackages,
  listOfProcesses,
  listOfIntervals,
  killProcess,
  killInterval,
} = require('services/processesManagment');

const checkSchema = require('services/schemaChecker');

const { jsonSchema: postFormDataJSON } = require('./schema/post/formData.schema');
const { openAPISchema: responseJSONOpenAPIpost200 } = require('./schema/post/responses/200.schema');
const { openAPISchema: responseJSONOpenAPIget200 } = require('./schema/get/responses/200.schema');
const { openAPISchema: responseJSONOpenAPIdelete200 } = require('./schema/delete/responses/200.schema');

const POST = async (req, res) => {
  const formData = {
    files: req.files,
    body: req.body,
  };

  // Check schemas
  const schemaResult = checkSchema(postFormDataJSON, formData);

  if (schemaResult.error) {
    Response.error(res, {
      status: 400, data: schemaResult.error,
    });
    return;
  }
  const { files } = req;
  const projectName = files.archive.name.substring(0, files.archive.name.length - 4);

  // Check if project exists in database
  const docs = await Projects.find({
    name: projectName,
  });

  if (docs.length === 0) {
    // Extract file to
    try {
      const stream = fs.createReadStream(files.archive.tempFilePath);
      const extractProcess = stream.pipe(tar.extract(`${process.env.PROJECTS_FILES}${projectName}`));
      extractProcess.on('finish', async () => {
        installPackages(projectName);
        // Read file
        const data = await projectsFilesManager.readData(`${projectName}/package.json`);
        // Add entries to mongoDB
        const newprojects = new Projects({
          name: projectName,
          dataDirectory: req.body.dataDirectory,
          scripts: data.scripts,
        });
        newprojects.save((err, doc) => {
          if (err) {
            Log.error(err);
            Response.error(res, {
              status: 500,
              data: {
                details: 'Unable to save project to database',
              },
            });
          } else {
            Response.success(res, {
              status: 201,
              data: {
                details: 'Saved project in database', data: doc,
              },
            });
          }
        });
      });
    } catch (error) {
      Log.error(error);
      Response.error(res, {
        status: 500,
        data: {
          details: 'File couldnt be processed',
        },
      });
    }
  } else {
    Response.error(res, {
      status: 409,
      data: {
        details: 'Project already exists!',
      },
    });
  }
};

const DELETE = async (req, res) => {
  try {
    const project = await Projects.findByIdAndDelete(req.query.id);
    if (project) {
      const dir = `${process.env.PROJECTS_FILES}/${project.name}`;
      // Halt currently runnings scripts of this project
      listOfProcesses().forEach((processData) => {
        if (processData.projectName === project.name) {
          killProcess(processData.id);
        }
      });
      // Halt intervals of this project
      listOfIntervals().forEach((intervalData) => {
        if (intervalData.projectName === project.name) {
          killInterval(intervalData.id);
        }
      });
      const resultDir = fs.rmdirSync(dir, {
        recursive: true,
      });
      if (resultDir === undefined) {
        Response.success(res, {
          status: 200,
          data: {
            details: `${project.name} deleted successfully`,
          },
        });
      }
    } else {
      throw Error('Couldnt find project in database');
    }
  } catch (error) {
    Log.error(error);
    Response.error(res, {
      status: 404,
      data: {
        details: 'Couldnt delete project',
      },
    });
  }
};

const GET = async (req, res) => {
  let docs;
  const projection = {
  };
  if (req.query.names_only) {
    projection.name = 1;
  }
  if (!req.query.id) {
    docs = await Projects.find({
    }, projection)
      .skip(Number(req.query.offset))
      .limit(Number(req.query.limit));
  } else {
    const projectsIDs = req.query.id.split(',');
    docs = await Projects.findById(projectsIDs, projection)
      .skip(Number(req.query.offset))
      .limit(Number(req.query.limit));
  }

  Response.success(res, {
    status: 200,
    data: {
      details: 'List of projects', data: docs,
    },
  });
};

POST.apiDoc = {
  summary: 'Upload project.',
  operationId: 'uploadProject',
  consumes: ['multipart/form-data'],
  tags: [
    __dirname.split(/[\\/]/).pop(),
  ],
  parameters: [
    {
      in: 'formData',
      name: 'archive',
      required: true,
      type: 'file',
      description: 'Tar file of project files',
    },
    {
      in: 'formData',
      name: 'dataDirectory',
      type: 'string',
      description: 'Directory with output from project',
    },
  ],
  responses: {
    200: {
      description: 'Added new project',
      schema: responseJSONOpenAPIpost200,
    },
    400: {
      description: 'Bad Requests',
      schema: {
        $ref: '#/definitions/BadRequest',
      },
    },
    409: {
      description: 'Project already exists',
    },
    500: {
      description: 'Request couldnt be processed',
    },
  },
};

GET.apiDoc = {
  summary: 'Get array of projects.',
  operationId: 'getProjects',
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
      description: 'Adds limit to queried projects',
    },
    {
      in: 'query',
      name: 'offset',
      type: 'string',
      description: 'Adds offset to queried projects',
    },

    {
      in: 'query',
      name: 'names_only',
      type: 'string',
      description: 'Return only IDs and names of queried projects',
    },
  ],
  responses: {
    200: {
      description: 'Array of projects',
      schema: responseJSONOpenAPIget200,
    },
  },
};

DELETE.apiDoc = {
  summary: 'Delete single project.',
  operationId: 'deleteProject',
  tags: [
    __dirname.split(/[\\/]/).pop(),
  ],
  parameters: [{
    in: 'query',
    name: 'id',
    required: true,
    type: 'string',
    description: 'ID of single project',
  }],
  responses: {
    200: {
      description: 'Removed project',
      schema: responseJSONOpenAPIdelete200,
    },
    404: {
      description: 'Couldnt find project to be removed',
    },
  },
};

const operations = {
  POST,
  GET,
  DELETE,
};

module.exports = operations;
