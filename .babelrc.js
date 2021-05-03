
module.exports = {
  plugins: [
    [
      require.resolve('babel-plugin-module-resolver'),
      {
        root: ["./src/"],
        alias: {
          "services/*": "./src/services/*",
          "routes/*": "./src/routes/*",
          "filesManagers": "./src/common/filesManagers.js"
        }
      }
    ]
  ]
};
