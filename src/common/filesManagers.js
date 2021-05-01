const { FileManager } = require('@autonomous-node-projects/tools');

const projectsFilesManager = new FileManager(process.env.PROJECTS_FILES);
const schemasFilesManager = new FileManager('src/routes/schema/');
const modelsFilesManager = new FileManager('src/common/database/models/');

module.exports = {
  projectsFilesManager,
  schemasFilesManager,
  modelsFilesManager,
};
