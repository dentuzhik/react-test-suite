const _ = require('lodash');
const fs = require('fs');
const path = require('path');

const nodeModules = {};

fs.readdirSync('node_modules')
    .filter(function(x) {
        return ['.bin'].indexOf(x) === -1;
    })
    .forEach(function(mod) {
        nodeModules[mod] = `commonjs ${mod}`;
    });

module.exports = {
    target: 'node',
    entry: './src/index.js',
    output: {
        path: path.join(__dirname, 'build'),
        filename: 'index.js',
        library: 'react-test-suite',
        libraryTarget: 'commonjs2'
    },
    module: {
        loaders: [
            {
                test: /\.js$/,
                loaders: ['babel-loader'],
                exclude: /node_modules/
            }
        ]
    },
    // Stuff, which is required to make enzyme work
    externals: _.assign({},
        nodeModules,
        {
            'react/addons': true,
            'react/lib/ExecutionEnvironment': true,
            'react/lib/ReactContext': true
        }
    )
};
