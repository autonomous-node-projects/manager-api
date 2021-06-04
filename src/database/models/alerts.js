const mongoose = require('mongoose');

const { Schema } = mongoose;

const Alert = new Schema({
  name: {
    type: String, required: true,
  },
  content: {
    type: String, required: true,
  },
  projectName: {
    type: String, required: true,
  },
  alertCreationDate: {
    type: Date,
  },
});

module.exports = mongoose.model('alerts', Alert);
