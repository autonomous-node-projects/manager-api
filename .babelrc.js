
module.exports = {
  plugins: [
    [
      require.resolve('babel-plugin-module-resolver'),
      {
        root: ["./src/"],
        alias: {
          "common/*": "./src/common/*",
          "routes/*": "./src/routes/*",
          "reqSchemas/*": "./src/routes/schema/*",
          "filesManagers": "./src/common/filesManagers.js"
        }
      }
    ]
  ]
};
