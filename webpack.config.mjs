import path from 'path';

/**
 * @type { import ('webpack').Configuration }
 */
const config = {
    entry: './src/index.js',
    output: {
        filename: 'index.js',
        path: path.resolve('./dist'),
    },
    module: {
        rules: [
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            }
        ]
    },
    devServer: {
        allowedHosts: 'all',
        port: 3000,
        proxy: {
            '/danmaku': 'http://localhost:10086',
            '/query': 'http://localhost:10086',
        },
        headers: {
            'Access-Control-Allow-Origin': '*',
        }
    }
};

export default config;
