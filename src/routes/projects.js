// System
const tar = require('tar-fs');
const fs = require('fs');

// Express
const express = require('express');

module.exports = express();
const app = module.exports;

// Common
const { Log } = require('@autonomous-node-projects/tools');
const Response = require('common/responseCreator');

// Data and schemas Manager
const { projectsFilesManager, schemasFilesManager } = require('common/filesManagers');

// Mongo
require('common/database/db');
const Projects = require('common/database/models/projects');

// Processes
const {
  installPackages,
  listOfProcesses,
  listOfIntervals,
  killProcess,
  killInterval,
} = require('common/processesManagment');
const checkSchema = require('common/schemaChecker');

//
// Upload
//
app.post('/project', async (req, res) => {
  // Get schemas
  const schemas = {
    files: await schemasFilesManager.readData('uploadProject/files.schema.json'),
    body: await schemasFilesManager.readData('uploadProject/body.schema.json'),
  };
  // Check schemas
  const schemaResult = {
    files: checkSchema(schemas.files, req.files),
    body: checkSchema(schemas.body, req.body),
  };

  if (schemaResult.files.error) {
    Response.error(res, {
      status: 500, data: schemaResult.files.error,
    });
    return;
  }
  if (schemaResult.body.error) {
    Response.error(res, {
      status: 500, data: schemaResult.body.error,
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
        details: 'Projects already exists!',
      },
    });
  }
});

//
// Delete
//
app.delete('/projects', async (req, res) => {
  try {
    const project = await Projects.findOneAndDelete(req.query.id);
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
});

// Get projects list
app.get('/projects', async (req, res) => {
  const docs = await Projects.find();
  Response.success(res, {
    status: 200,
    data: {
      details: 'List of all projects', data: docs,
    },
  });
});
