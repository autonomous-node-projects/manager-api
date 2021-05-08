const tar = require('tar-fs');
const fs = require('fs');
const dirTree = require('directory-tree');
const { resolve } = require('path');

const { Log } = require('@autonomous-node-projects/tools');
const Response = require('services/responseCreator');

require('database/db');
const Projects = require('database/models/projects');

const GET = async (req, res) => {
  if (req.query.type === 'tree') {
    const project = await Projects.findById(req.query.id);
    try {
      const dir = `${process.env.PROJECTS_FILES}${project.name}/${project.dataDirectory}`;
      Response.success(res, {
        status: 200,
        data: {
          details: 'Tree of data', data: dirTree(dir),
        },
      });
    } catch (e) {
      Response.error(res, {
        status: 400,
        data: {
          details: 'no such a project 😓',
        },
      });
    }
  } else if (req.query.type === 'download') {
    const project = await Projects.findById(req.query.id);
    if (project.dataDirectory) {
      try {
        const dir = `${process.env.PROJECTS_FILES}${project.name}/${project.dataDirectory}`;

        const tarFileAbsolutePath = resolve(`${process.env.TMP_FILES}${project.name}.tar`);
        fs.mkdirSync(`${process.env.TMP_FILES}`, {
          recursive: true,
        });

        const writeStream = fs.createWriteStream(tarFileAbsolutePath);
        const tarData = tar.pack(dir);
        tarData.pipe(writeStream);

        tarData.on('end', async () => {
          res.setHeader('Content-Type', 'application/x-tar');
          res.setHeader('Content-disposition', `attachment;filename=${project.name}.tar`);
          res.sendFile(tarFileAbsolutePath);
        });
      } catch (e) {
        Log(e);
        Response.error(res, {
          status: 400,
          data: {
            details: 'no such a project 😓',
          },
        });
      }
    } else {
      Response.error(res, {
        status: 404,
        data: {
          details: 'This project has no data output directory',
        },
      });
    }
  }
};

GET.apiDoc = {
  summary: 'Got output data.',
  operationId: 'getOutput',
  consumes: ['application/json'],
  tags: [
    __dirname.split(/[\\/]/).pop(),
  ],
  parameters: [{
    in: 'query',
    name: 'id',
    required: true,
    type: 'string',
    description: 'ID of project',
  },
  {
    in: 'query',
    name: 'type',
    required: true,
    type: 'string',
    description: 'Type of returned data(tree or download)',
  },
  ],
  responses: {
    200: {
      description: 'Output data as tree or file basing on query.type',
    },
    400: {
      description: 'Didnt find projects',
    },
  },
};

const operations = {
  GET,
};

module.exports = operations;
