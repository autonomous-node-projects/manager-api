function Response() {}

Response.error = (res, error) => res.status(error.status).send(error.data);

Response.success = (res, success) => res.status(success.status).send(success.data);

module.exports = Response;
