const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

function buildRules(name, includeStyles, includeBootstrap) {
  const rules = [];
  
  let rule = { 
    test: /\.js$/,
    use: ["source-map-loader"],
    enforce: "pre"
  };
  rules.push(rule);

  if (includeStyles) {
    rule = {
      test: /\.css$/,
      use: [
        { loader: 'style-loader' },
        { loader: 'css-loader' }
      ]
    };
    rules.push(rule);
  }

  if (includeBootstrap) {
    rule = { 
      // to load bootstrap fonts
      test: /\.(png|woff|woff2|eot|ttf|svg)$/,
      use: [
          {
              loader: 'url-loader',
              options: {
                  limit: 100000//,
                  //outputPath: `./${name}`
              }
          }
      ]
    };
    rules.push(rule);
  }

  return rules;
}

function buildConfig(name, includeStyles, includeBootstrap) {
  return {
    name,
    mode: 'development',
    entry: `./src/${name}/index.js`,
    module: { 
      rules: buildRules(name, includeStyles, includeBootstrap)
    },
    output: {
      filename: 'main.js',
      path: path.resolve(__dirname, 'dist', name)
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: `./src/${name}/index.html`
      }),
      new CopyWebpackPlugin([
        { from: `./src/${name}/favicon.ico`, to: './' },
        { from: `./src/${name}/assets`, to: './assets' }
      ])
    ],
    devServer: {
      contentBase: './dist',
      port: 3000
    },
    devtool: "inline-source-map"
  };
}

module.exports = [
  buildConfig('platform-provider'),
  buildConfig('platform-window', true, true)
];