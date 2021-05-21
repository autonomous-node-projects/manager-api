/* eslint-disable no-underscore-dangle */
const { Log } = require('@autonomous-node-projects/tools');
const Projects = require('database/models/projects');
const calculateTimeMultiplier = require('services/timeMultiplier');

require('database/db.js');

const { createProcessInterval, spawnProcess } = require('services/processesManagment');

const runScheduled = async () => {
  const docs = await Projects.find();
  let amount = 0;
  docs.forEach((project) => {
    if (project.schedules) {
      project.schedules.forEach((schedule) => {
        const processIntervalConfig = {
          projectName: project.name,
          scriptName: schedule.scriptName,
          time: schedule.every.value,
          timeType: schedule.every.timeType,
          exitAfter: schedule.exitAfter,
          scheduleId: schedule._id,
          nextRun: schedule.nextRun,
        };

        if (processIntervalConfig.scriptName) {
          // Check if is set date of next run of script
          amount += 1;
          const everyDiffMs = (
            calculateTimeMultiplier(processIntervalConfig.timeType)
            * processIntervalConfig.time
            * 1000
          );

          // Calculate next run
          if (processIntervalConfig.nextRun) {
            const nextRunDate = new Date(processIntervalConfig.nextRun);
            // If Exceeded
            if (Date.now() > nextRunDate) {
              const currentDate = new Date();
              const datesDiffInMs = Date.now() - nextRunDate;
              const missedRuns = Math.floor(datesDiffInMs / everyDiffMs);
              const missedMs = missedRuns * everyDiffMs + everyDiffMs;
              const waitMs = nextRunDate.getTime() + missedMs - currentDate.getTime();
              // Log.warn(`Next run of ${processIntervalConfig.projectName}/$
              // {processIntervalConfig.scriptName}:${new Date(nextRunDate.getTime() + missedMs)}`);
              // Log.warn(`Next run within: ${waitMs} ms`);
              setTimeout(() => {
                spawnProcess(processIntervalConfig.scriptName, processIntervalConfig.projectName);
                createProcessInterval(processIntervalConfig);
              }, waitMs);
            } else {
              // If before next run date
              const waitMs = nextRunDate - Date.now();
              setTimeout(() => {
                spawnProcess(processIntervalConfig.scriptName, processIntervalConfig.projectName);
                createProcessInterval(processIntervalConfig);
              }, waitMs);
            }
          } else {
            createProcessInterval(processIntervalConfig);
          }
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
