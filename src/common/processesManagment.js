const { spawn } = require('child_process');
const { v4: uuidv4 } = require('uuid');

// Mongo
require('common/database/db');
const Scrapers = require('common/database/models/projects');

// Common
const { Log } = require('@autonomous-node-projects/tools');
const calculateTimeMultiplier = require('common/timeMultiplier');

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

const createProcessInterval = (
  projectName,
  scriptName,
  time,
  timeType,
  terminateAfter,
) => {
  const intervalId = uuidv4();
  let teminatingCount = terminateAfter;
  const multiplier = calculateTimeMultiplier(timeType);

  const msInterval = time * 1000 * multiplier;

  const processInterval = setInterval(async () => {
    spawnProcess(scriptName, projectName);
    if (teminatingCount !== undefined) {
      if (teminatingCount === 1) {
        // Update DB
        Scrapers.updateOne({
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
      } else {
        const index = intervalsList.findIndex((interval) => interval.projectName === projectName);
        if (intervalsList[index]) {
          intervalsList[index].left -= 1;
          teminatingCount -= 1;
          Scrapers.updateOne({
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
