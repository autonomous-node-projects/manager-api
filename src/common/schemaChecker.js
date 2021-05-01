require('joi');
const Enjoi = require('enjoi');

const checkSchema = (schema, parsedJSON) => {
  const joiSchema = Enjoi.schema(schema);

  const { error, value } = joiSchema.validate(parsedJSON);
  return {
    error, value,
  };
};

module.exports = checkSchema;
