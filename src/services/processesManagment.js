/* eslint-disable no-underscore-dangle */
const { spawn } = require('child_process');
const { v4: uuidv4 } = require('uuid');

require('database/db');
const Projects = require('database/models/projects');

const { Log } = require('@autonomous-node-projects/tools');
const calculateTimeMultiplier = require('services/timeMultiplier');

let processesList = [];
let intervalsList = [];

const spawnProcess = (scriptName, projectName) => {
  const projectProcess = spawn(
    'npm',
    ['run', scriptName, `--prefix ${process.env.PROJECTS_FILES}${projectName}`],
    {
      shell: true,
    },
  );

  const processId = uuidv4();
  processesList.push({
    id: processId, projectName, scriptName, process: projectProcess,
  });

  Log(`Running script: "${scriptName}" from "${projectName}"`);
  // Log all data about project process
  projectProcess.stdout.on('data', (data) => {
    Log(`${projectName} : stdout: ${data}`);
  });

  projectProcess.stderr.on('data', (data) => {
    Log.error(`${projectName} : stderr: ${data}`);
  });

  projectProcess.on('close', (code) => {
    Log(`${projectName} : child process exited with code ${code}`);
    Log.success(`${projectName} : Ended running "${projectName}" script`);
    processesList = processesList.filter((processData) => processId !== processData.id);
  });

  return processId;
};

const installPackages = async (projectName) => {
  const projectProcess = spawn(
    'npm',
    ['install --only=prod'],
    {
      shell: true, cwd: `${process.env.PROJECTS_FILES}${projectName}`,
    },
  );
  Log(`Installing "${projectName}" packages`);

  // Log all data about project process
  projectProcess.stdout.on('data', (data) => {
    Log(`${projectName} : stdout: ${data}`);
  });

  projectProcess.stderr.on('data', (data) => {
    Log.error(`${projectName} : stderr: ${data}`);
  });

  projectProcess.on('close', (code) => {
    Log(`${projectName} : Child process exited with code ${code}`);
    Log.success(`${projectName} : Installed "${projectName}" packages`);
    return 1;
  });
};

const updateNextRun = async (scheduleId, everyDiffMs) => {
  const nextRunUpdated = new Date(new Date().getTime() + everyDiffMs);
  let project = await Projects.findOne({
    'schedules._id': scheduleId,
  });
  project = Object(project);
  const scheduleIndex = (
    project.schedules.findIndex((schedule) => String(schedule._id) === String(scheduleId))
  );
  project.schedules[scheduleIndex].nextRun = nextRunUpdated;
  Projects.updateOne({
    'schedules._id': scheduleId,
  },
  {
    $set: {
      schedules: project.schedules,
    },
  },
  {
    upsert: true,
  }, (err, docs) => {
  });
};

const createProcessInterval = async ({
  projectName,
  scriptName,
  time,
  timeType,
  terminateAfter,
  scheduleId,
  nextRun,
}) => {
  if (scheduleId) {
    Log.warn(`Updating schedule next run${scheduleId}`);
    const everyDiffMs = calculateTimeMultiplier(timeType) * time * 1000;
    updateNextRun(scheduleId, everyDiffMs);
  }
  const intervalIndex = (
    intervalsList.findIndex((interval) => interval.projectName === projectName)
  );
  const everyDiffMs = calculateTimeMultiplier(timeType) * time * 1000;
  const intervalId = uuidv4();
  let teminatingCount = terminateAfter;
  const msInterval = time * 1000 * calculateTimeMultiplier(timeType);

  const processInterval = setInterval(async () => {
    spawnProcess(scriptName, projectName);

    if (scheduleId) {
      updateNextRun(scheduleId, everyDiffMs);
    }

    if (teminatingCount !== undefined) {
    // If exceeded exitAfter
      if (teminatingCount === 1) {
        // Update DB
        Projects.updateOne({
          name: projectName,
        },
        {
          schedule: null,
        }, (err, docs) => {
          if (err) {
            Log.error(err);
          } else {
            Log(`Updated schedule in DB: ${docs}`);
          }
        });
        intervalsList = intervalsList.filter((interval) => interval.left !== 1);
        clearInterval(processInterval);
      } else if (intervalsList[intervalIndex]) {
        intervalsList[intervalIndex].left -= 1;
        teminatingCount -= 1;
        Projects.updateOne({
          name: projectName,
        },
        {
          'schedule.exitAfter': teminatingCount,
        }, (err, docs) => {
          if (err) {
            Log.error(err);
          } else {
            Log(`Updated schedule in DB: ${docs}`);
          }
        });
      }
    }
  }, msInterval);

  intervalsList.push({
    id: intervalId,
    processInterval,
    projectName,
    scriptName,
    every: {
      time,
      timeType,
    },
    left: terminateAfter,
    nextRun,
  });

  return intervalId;
};

const listOfProcesses = () => processesList;
const listOfIntervals = () => intervalsList.map((intervalData) => {
  const currentIntervalData = intervalData;
  delete currentIntervalData.processInterval;
  return intervalData;
});

const killProcess = (id) => {
  try {
    const processDataToKill = processesList.find((processData) => processData.id === id);
    processDataToKill.process.kill('SIGINT');
    return true;
  } catch (error) {
    Log.error(error);
    return false;
  }
};

const killInterval = (id) => {
  try {
    const intervalDataToKill = intervalsList.find((intervalData) => intervalData.id === id);
    intervalsList = intervalsList.filter((interval) => interval.id !== id);
    clearInterval(intervalDataToKill.processInterval);
    return true;
  } catch (error) {
    Log.error(error);
    return false;
  }
};

module.exports = {
  installPackages,
  spawnProcess,
  createProcessInterval,
  listOfProcesses,
  listOfIntervals,
  killProcess,
  killInterval,
};
