require("dotenv").config();

module.exports = {
  node_env: process.env.NODE_ENV,
  server: {
    port: process.env.SERVER_PORT,
  },
  constants: {
    url: {
      TEST_URL: ""
    },
  },
};
