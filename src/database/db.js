const mongoose = require('mongoose');

const connection = {
  url: `${process.env.DB_URL}/${process.env.DB_DB}`,
  options: {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useFindAndModify: false,
  },
};

mongoose.connect(connection.url, connection.options);
