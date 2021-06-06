const Subscriber = require('database/models/subscriber');
const Response = require('services/responseCreator');
const webpush = require('web-push');

const POST = async (req, res) => {
  const vapidKeys = {
    publicKey: process.env.PUBLIC_VAPID_KEY,
    privateKey: process.env.PRIVATE_VAPID_KEY,
  };

  webpush.setVapidDetails(
    'mailto:you@domain.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey,
  );

  const sub = new Subscriber(req.body);

  sub.save((err, doc) => {
    if (err) {
      Response.error(res, {
        status: 500,
        data: {
          details: 'Unable to add subscription',
        },
      });
    } else {
      Response.success(res, {
        status: 201,
        data: {
          details: 'Subscription added successfully.',
        },
      });
    }
  });
};

POST.apiDoc = {
  summary: 'WebPush functions.',
  operationId: 'addPushSub',
  tags: [
    __dirname.split(/[\\/]/).pop(),
  ],
  consumes: ['application/json'],
  responses: {
    200: {
      description: 'Added push subscription.',
    },
  },
};

const operations = {
  POST,
};

module.exports = operations;
