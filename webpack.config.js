const path = require("path");

module.exports = {
  mode: "development",
  entry: "./src/renderer/index.jsx",
  target: "electron-renderer",
  output: {
    path: path.resolve(__dirname, "public"),
    filename: "renderer.js",
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-react", "@babel/preset-env"],
          },
        },
      },
    ],
  },
  resolve: {
    extensions: [".js", ".jsx"],
  },
};
