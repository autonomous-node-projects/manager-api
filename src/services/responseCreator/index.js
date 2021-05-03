const checkSchema = require('services/schemaChecker');
const { FileManager, Log } = require('@autonomous-node-projects/tools');

const schemaLoader = async (schemaPath) => {
  const indexStartFilename = schemaPath.lastIndexOf('/');
  const pathToDir = schemaPath.substring(0, indexStartFilename + 1);
  // Log.error(pathToDir);
  const fileName = schemaPath.substring(indexStartFilename + 1, schemaPath.length);
  // Log.error(fileName);
  const schema = await new FileManager(pathToDir).readData(fileName);
  return schema;
};

const checkResponseData = async (responseObject) => {
  const schema = schemaLoader('schema/response.schema.json');
  const result = checkSchema(schema, responseObject.data);
  if (result.error) {
    Log.error('Response not matching schema!');
    Log.error(responseObject);
    Log.error(result.error);
  }
};

function Response() {}

Response.error = async (res, error) => {
  checkResponseData(error);
  res.status(error.status).send(error.data);
};

Response.success = (res, success) => {
  checkResponseData(success);
  res.status(success.status).send(success.data);
};

module.exports = Response;
