const { FileManager } = require('@autonomous-node-projects/tools');

const projectsFilesManager = new FileManager(process.env.PROJECTS_FILES);

module.exports = {
  projectsFilesManager,
};
