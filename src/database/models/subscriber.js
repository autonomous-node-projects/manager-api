const mongoose = require('mongoose');

const { Schema } = mongoose;

const Subscriber = new Schema({
  endpoint: {
    type: String, required: true,
  },
  keys: {
    auth: {
      type: String, required: true,
    },
    p256dh: {
      type: String, required: true,
    },
  },
});

module.exports = mongoose.model('subscribers', Subscriber);
