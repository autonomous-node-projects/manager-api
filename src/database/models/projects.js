const mongoose = require('mongoose');

const { Schema } = mongoose;

const Project = new Schema({
  name: {
    type: String, required: true,
  },
  dataDirectory: {
    type: String,
  },
  scripts: {
    type: Object, required: true,
  },
  schedules: [{
    scriptName: {
      type: String,
    },
    every: {
      value: {
        type: Number,
      },
      timeType: {
        type: String,
      },
    },
    exitAfter: {
      type: Number,
    },
    nextRun: {
      type: Date,
    },
  }],
});

module.exports = mongoose.model('projects', Project);
