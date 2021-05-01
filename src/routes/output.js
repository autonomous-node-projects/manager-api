// System
const tar = require('tar-fs');
const fs = require('fs');
const dirTree = require('directory-tree');
const { resolve } = require('path');

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

//
// Return data tree files
//
app.get('/output/tree', async (req, res) => {
  const script = await Projects.findById(req.query.id);
  try {
    const dir = `${process.env.PROJECTS_FILES}${script.name}/${script.dataDirectory}`;
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
});

//
// Retrive Project data files returned as tar file
//
app.get('/output/download', async (req, res) => {
  const project = await Projects.findById(req.query.id);
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
});
