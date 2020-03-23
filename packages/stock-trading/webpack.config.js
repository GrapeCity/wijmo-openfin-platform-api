const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    mode: 'development',
    entry: './src/index.ts',
    module: {
        rules: [
            {
                test: /\.js$/,
                use: ["source-map-loader"],
                enforce: "pre"
            },
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            },
            {
                test: /\.css$/,
                use: [
                  { loader: 'style-loader' },
                  {
                    loader: 'css-loader'
                  }
                ]
            },
            { 
                // to load bootstrap fonts
                test: /\.(png|woff|woff2|eot|ttf|svg)$/, 
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            limit: 100000
                        }
                    }
                ]
            }
        ]
    },
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'dist')
    },
    resolve: {
        symlinks: false,
        extensions: [ '.ts', '.tsx', '.js' ],
        mainFields: ['wj-esm2015', 'module', 'main']
    },
    plugins: [
        new HtmlWebpackPlugin({  
          template: 'index.html'
        }),
        new CopyPlugin([
            { from: 'src/favicon.ico', to: '' },
            { from: 'src/app.json', to: '' },
            { from: 'src/assets', to: 'assets' }
        ])
    ],
    devServer: {
        contentBase: './dist',
        port: 3300
    },
    devtool: "inline-source-map"
};