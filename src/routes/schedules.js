/* eslint-disable no-underscore-dangle */
// Express
const express = require('express');

// Mongo
const mongoose = require('mongoose');
require('common/database/db');

// Common
const { Log } = require('@autonomous-node-projects/tools');
const Response = require('common/responseCreator');
const calculateTimeMultiplier = require('common/timeMultiplier');

// Mongo
const Projects = require('common/database/models/projects');

// Processes
const { createProcessInterval } = require('common/processesManagment');
const checkSchema = require('common/schemaChecker');

module.exports = express();
const app = module.exports;

// schemasManager
const { schemasFilesManager } = require('common/filesManagers');

//
// Create schedules
//
app.put('/schedules', async (req, res) => {
  // Get schemas
  const schemas = {
    body: await schemasFilesManager.readData('createSchedule/body.schema.json'),
  };

  // Check schemas
  const schemaResult = {
    body: checkSchema(schemas.body, req.body),
  };

  if (schemaResult.body.error) {
    Response.error(res, {
      status: 500, data: schemaResult.body.error,
    });
    return;
  }

  // Find project by _Id
  const project = await Projects.findById(req.query.id, (err, docs) => {
    if (err) {
      Log.error(err);
    }
    return docs;
  });

  // Log(JSON.stringify(project, null, 2));
  if (!project) {
    Response.error(res, {
      status: 404,
      data: {
        details: `Didn't find in project with id: ${req.query.id}`,
      },
    });
  }

  if (project) {
    const { body } = req;
    const projectName = project.name;
    // Check if all project scripts exists
    const projectScripts = project.scripts;
    const notAvailableScripts = [];
    body.forEach((schedule) => {
      if (!Object.keys(projectScripts).includes(schedule.scriptName)) {
        notAvailableScripts.push(schedule.scriptName);
      }
    });

    if (notAvailableScripts.length > 0) {
      Log('Script couldnt be found in project');
      Response.error(res, {
        status: 404,
        data: {
          details: `Didn't find scripts in project ${projectName} with id: ${req.query.id}`,
          data: {
            notFound: notAvailableScripts,
          },
        },
      });
    }

    // Add date of next run and id to schedule
    const newSchedules = body.map((schedule) => {
      const msToAdd = (
        calculateTimeMultiplier(schedule.every.timeType)
          * schedule.every.value * 1000
      );
      const nextRun = new Date(Date.now() + msToAdd);
      return {
        _id: new mongoose.Types.ObjectId(), ...schedule, nextRun,
      };
    });

    let updatedSchedules = newSchedules;
    if (project.schedules) {
      updatedSchedules = project.schedules.concat(newSchedules);
    }

    // Update DB
    let projectUpdated;
    await Projects.findByIdAndUpdate({
      _id: req.query.id,
    },
    {
      schedules: updatedSchedules,
    }, (err, docs) => {
      if (err) {
        Log.error(err);
      } else {
        Log.success(`Added schedules in DB for project: ${projectName}`);
        projectUpdated = Object(docs);
      }
    });

    const allSchedules = [...projectUpdated.schedules, ...newSchedules];
    Log(`Starting new schedules for ${projectName} (${body.length})`);

    // Spawn processes once and Create Intervals
    body.forEach((schedule) => {
      const intervalId = createProcessInterval(
        projectName,
        schedule.scriptName,
        schedule.every.value,
        schedule.every.timeType,
        schedule.exitAfter,
      );
      return {
        id: intervalId, scriptName: schedule.scriptName,
      };
    });

    // Send respond
    Response.success(res, {
      status: 201,
      data: {
        details: `Created new schedules(${body.length}) of commands in project ${projectName}`,
        return: 'Returned data presents schedules ids with script names affilated with schedule',
        data: allSchedules.map((schedule) => (
          {
            id: schedule._id, scriptName: schedule.scriptName,
          }
        )),
      },
    });
  }
});

//
// Delete schedules
//
app.delete('/schedules', async (req, res) => {
  let scheduleIds;
  if (typeof (req.query.id) === 'string') {
    scheduleIds = [req.query.id];
  } else {
    scheduleIds = Object.values(req.query.id);
  }
  const parsedIds = [];
  scheduleIds.forEach((id) => {
    try {
      parsedIds.push(mongoose.Types.ObjectId(id));
    } catch (error) {
      Log.warn('Its not mongo type of ID!');
    }
  });

  const foundResult = await Projects.find({
    'schedules._id': {
      $in: parsedIds,
    },
  }, (err, docs) => {
    if (err) {
      Log.error(err);
    }
    return Object(docs);
  });

  const foundSchedules = [];
  foundResult.forEach((project) => {
    project.schedules.forEach((schedule) => {
      foundSchedules.push(schedule);
    });
  });
  // Log.warn(foundSchedules);

  const removedResult = await Projects.updateMany({
  }, {
    $pull: {
      schedules: {
        _id: {
          $in: parsedIds,
        },
      },
    },
  }, (err, docs) => {
    if (err) {
      Log.error(err);
    }
    return Object(docs);
  });

  if (foundSchedules.length === removedResult.n) {
    Response.success(res, {
      status: 200,
      data: {
        details: 'Successfully deleted selected schedules',
      },
    });
  } else {
    Response.error(res, {
      status: 404,
      data: {
        details: `Couldnt find ${removedResult.n - removedResult.nModified} schedules`,
      },
    });
  }
});
