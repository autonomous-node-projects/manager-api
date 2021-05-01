// Common
const { Log } = require('@autonomous-node-projects/tools');
const Projects = require('common/database/models/projects');

// DB
require('common/database/db.js');

// Processes
const { createProcessInterval } = require('common/processesManagment');

const runScheduled = async () => {
  const docs = await Projects.find();
  let amount = 0;
  docs.forEach((project) => {
    if (project.schedules) {
      project.schedules.forEach((schedule) => {
        if (schedule.scriptName) {
          // Check if is set date of next run of script
          amount += 1;
          // Log(`Starting schedule for ${project.name} with script ${schedule.scriptName}`);
          createProcessInterval(
            project.name,
            schedule.scriptName,
            schedule.every.value,
            schedule.every.timeType,
            schedule.exitAfter,
          );
        }
      });
    }
  });
  if (amount !== 0) {
    Log.success(`Started schedules: (${amount})`);
  } else {
    Log.success('No schedules, waiting for calls');
  }
};

module.exports = runScheduled;
