const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
	entry: {
		app: path.resolve(__dirname, 'src/scripts/index.js'),
	},
	output: {
		filename: '[name].bundle.js',
		path: path.resolve(__dirname, 'dist'),
		clean: true,
	},
	module: {
		rules: [
			{
				// Import template HTML sebagai string
				test: /\.html$/i, // definisi berkas html
				include: path.resolve(__dirname, 'src/scripts/templates'), // sesuaikan alamat
				type: 'asset/source', // Import sebagai teks
			},
			{
				test: /\.(png|jpe?g|gif)$/i,
				type: 'asset/resource',
			},
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: ['@babel/preset-env'],
					},
				},
			},
			{
				test: /\.css$/i,
				use: ['style-loader', 'css-loader'],
			},
		],
		parser: {
			javascript: {
				importMeta: true,
			},
		},
	},
	plugins: [
		new CleanWebpackPlugin(),
		new HtmlWebpackPlugin({
			template: path.resolve(__dirname, 'src/index.html'),
			scriptLoading: 'module',
		}),
		new CopyWebpackPlugin({
			patterns: [
				{
					from: path.resolve(__dirname, 'src/public/manifest.json'),
					to: path.resolve(__dirname, 'dist/manifest.json'),
				},
				{
					from: path.resolve(__dirname, 'src/public/favicon.ico'),
					to: path.resolve(__dirname, 'dist/'),
				},
				{ from: path.resolve(__dirname, 'src/model/'), to: 'model' },
				{ from: path.resolve(__dirname, 'src/public/icons/'), to: 'icons' },
				{ from: path.resolve(__dirname, 'src/public/screenshots/'), to: 'screenshots' },
			],
		}),
	],
	stats: {
		warningsFilter: /import\.meta/,
	},
};
