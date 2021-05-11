const { openAPISchema: badRequestOpenAPI } = require('./schemas/400.schema');
const { openAPISchema: projectOpenAPI } = require('./schemas/project.schema');

const apiDoc = {
  swagger: '2.0',
  basePath: '/',
  info: {
    title: process.env.npm_package_name,
    version: process.env.npm_package_version,
    contact: {
      name: 'API maintainer',
      url: 'https://github.com/autonomous-node-projects/manager-api',
      email: 'taafeenn@gmail.com',
    },
  },
  tags: [
    {
      name: 'intervals',
      description: 'All endpoints of intervals',
    },
    {
      name: 'output',
      description: 'All endpoints of output',
    },
    {
      name: 'processes',
      description: 'All endpoints of processes',
    },
    {
      name: 'projects',
      description: 'All endpoints of projects',
    },
    {
      name: 'schedules',
      description: 'All endpoints of schedules',
    },
  ],
  definitions: {
    Project: projectOpenAPI,
    BadRequest: badRequestOpenAPI,
  },
  paths: {
  },
};
module.exports = apiDoc;
