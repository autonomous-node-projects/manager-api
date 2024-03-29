/* eslint-disable no-underscore-dangle */
const mongoose = require('mongoose');
require('database/db');
const Projects = require('database/models/projects');

const { Log } = require('@autonomous-node-projects/tools');
const Response = require('services/responseCreator');
const calculateTimeMultiplier = require('services/timeMultiplier');

const { createProcessInterval } = require('services/processesManagment');
const checkSchema = require('services/schemaChecker');

const { jsonSchema: postBodyJSON, openAPISchema: postBodyOpenAPI } = require('./schema/post/body.schema');

const POST = async (req, res) => {
  // Get schemas
  const schemas = {
    body: postBodyJSON,
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
        details: `Didn't find project with id: ${req.query.id}`,
      },
    });
  } else {
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
    newSchedules.forEach((schedule) => {
      Log.warn(schedule);
      const intervalId = createProcessInterval({
        projectName,
        scriptName: schedule.scriptName,
        time: schedule.every.value,
        timeType: schedule.every.timeType,
        exitAfter: schedule.exitAfter,
        scheduleId: schedule._id,
      });
      return {
        id: intervalId, scriptName: schedule.scriptName,
      };
    });

    // Send respond
    Response.success(res, {
      status: 201,
      data: {
        details: `Created new schedules(${body.length}) of commands in project ${projectName}`,
        data: allSchedules,
      },
    });
  }
};

const DELETE = async (req, res) => {
  const scheduleIds = req.query.id.split(',');
  let parsedIds = [];
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

  parsedIds = parsedIds.map((id) => String(id));
  const foundSchedules = foundResult.map((project) => (
    project.schedules.map((schedule) => parsedIds.includes(String(schedule._id)))
  )).flat().filter((schedule) => schedule).length;

  await Projects.updateMany({
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
  });

  if (foundSchedules === parsedIds.length) {
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
        details: `Couldnt find ${parsedIds.length - foundSchedules} schedules`,
      },
    });
  }
};

// DOCUMENTATION
POST.apiDoc = {
  summary: 'Add new schedules.',
  operationId: 'addSchedules',
  consumes: ['application/json'],
  tags: [
    __dirname.split(/[\\/]/).pop(),
  ],
  parameters: [
    {
      in: 'query',
      name: 'id',
      required: true,
      type: 'string',
      description: 'ID of project with script which will be scheduled',
    },
    {
      in: 'body',
      name: 'schedules',
      schema: postBodyOpenAPI,
    }],
  responses: {
    201: {
      description: 'Returned data presents schedules ids with script names affilated with schedule',
    },
  },
};
DELETE.apiDoc = {
  summary: 'Delete schedules by IDs.',
  operationId: 'deleteSchedule',
  consumes: ['application/json'],
  tags: [
    __dirname.split(/[\\/]/).pop(),
  ],
  parameters: [
    {
      in: 'query',
      name: 'id',
      required: true,
      type: 'string',
      description: 'IDs of schedules which will be deleted',
    },
  ],
  responses: {
    200: {
      description: 'Deleted successfully',
    },
  },
};

const operations = {
  POST,
  DELETE,
};

module.exports = operations;
