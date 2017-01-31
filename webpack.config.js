module.exports = {
    target: 'web',
    entry: './src/index.js',
    output: {
        filename: './build/index.js'
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
    externals: {
        'react/addons': true,
        'react/lib/ExecutionEnvironment': true,
        'react/lib/ReactContext': true
    }
};
