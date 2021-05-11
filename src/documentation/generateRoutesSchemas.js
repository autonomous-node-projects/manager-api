const convert = require('@openapi-contrib/json-schema-to-openapi-schema');
const { Log, FileManager } = require('@autonomous-node-projects/tools');
const { readdirSync, writeFile } = require('fs');

const routesManager = new FileManager('src/routes/');

const getDirectories = (source) => readdirSync(source, {
  withFileTypes: true,
})
  .filter((dirent) => dirent.isDirectory())
  .map((dirent) => dirent.name);

const getFiles = (source) => readdirSync(source, {
  withFileTypes: true,
})
  .map((dirent) => dirent.name);

Log('Generating json type body schemas for routes');
getDirectories('./src/routes/').forEach(async (dirName) => {
  getDirectories(`./src/routes/${dirName}/schema/`).forEach(async (method) => {
    // Methods requests
    getFiles(`./src/routes/${dirName}/schema/${method}/`).forEach(async (parameterType) => {
      const ext = parameterType.substring(parameterType.lastIndexOf('.'), parameterType.length);
      const name = parameterType.substring(0, parameterType.lastIndexOf('.'));
      if (ext === '.json') {
        try {
          const data = await routesManager.readData(`${dirName}/schema/${method}/${parameterType}`);
          if (data.type !== 'no data') {
            const openAPI = await convert(data).then((result) => result);
            const newScript = `const jsonSchema = ${JSON.stringify(data, null, 1)}; \nconst openAPISchema = ${JSON.stringify(openAPI, null, 4)}; \nmodule.exports = { jsonSchema, openAPISchema };`;
            Log.success(`Generating schema ./src/routes/${dirName}/schema/${method}/${parameterType}`);
            writeFile(`./src/routes/${dirName}/schema/${method}/${name}.js`, newScript, (err) => {
              if (err) {
                return Log.error(err);
              }
            });
          } else {
            Log.error(`JSON schemas for route: ${dirName} was not found`);
          }
        } catch (error) {
          Log.warn(error);
        }
      }
    });
    // Methods responses
    getFiles(`./src/routes/${dirName}/schema/${method}/responses`).forEach(async (response) => {
      const ext = response.substring(response.lastIndexOf('.'), response.length);
      const name = response.substring(0, response.lastIndexOf('.'));
      if (ext === '.json') {
        try {
          const data = await routesManager.readData(`${dirName}/schema/${method}/responses/${response}`);
          if (data.type !== 'no data') {
            const openAPI = await convert(data).then((result) => result);
            const newScript = `const jsonSchema = ${JSON.stringify(data, null, 1)}; \nconst openAPISchema = ${JSON.stringify(openAPI, null, 4)}; \nmodule.exports = { jsonSchema, openAPISchema };`;
            Log.success(`Generating schema ./src/routes/${dirName}/schema/${method}/responses/${response}`);
            writeFile(`./src/routes/${dirName}/schema/${method}/responses/${name}.js`, newScript, (err) => {
              if (err) {
                return Log.error(err);
              }
            });
          } else {
            Log.error(`JSON schemas for route: ${dirName} was not found`);
          }
        } catch (error) {
          Log.warn(error);
        }
      }
    });
  });
});
