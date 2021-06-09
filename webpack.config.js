const currentTask = process.env.npm_lifecycle_event
const path = require('path')
const webpack = require('webpack');
const {CleanWebpackPlugin} = require('clean-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const recursiveSync = require('recursive-readdir-sync')

const postCSSPlugins = [
     require('postcss-import'),
     require('postcss-url')(currentTask === "devl" ? {url: 'inline',ignoreFragmentWarning: true} : {}),
     require('postcss-mixins'),
     require('postcss-simple-vars'),
     require('postcss-nested'),
     require('postcss-hexrgba'),
     require('autoprefixer')
]


let cssConfig = [
     {
          test: /\.p?css$/i,
          use: [
               'css-loader',
               { loader: 'postcss-loader', options: { postcssOptions: { plugins: postCSSPlugins } } }
          ]
     },
     {
          test: /\.s(a|c)+ss$/i,
          use: [
               'css-loader',
               { loader: 'resolve-url-loader', options: { keepQuery: true } },
               { loader: 'postcss-loader', options: { postcssOptions: { plugins: [ require('autoprefixer') ] } } },
               'sass-loader'
          ]
     },
     {
          test: /\.less$/i,
          use: [
               'css-loader',
               { loader: 'resolve-url-loader', options: { keepQuery: true } },
               { loader: 'postcss-loader', options: { postcssOptions: { plugins: [ require('autoprefixer') ] } } },
               'less-loader'
          ]
     }
];





let config = {
     entry: './app/assets/scripts/App.js',
     resolve: { alias: { thirdparty: path.resolve(__dirname, 'app/assets/third-party/') } },
     watch: true,
     plugins: [],
     module: {
          rules: cssConfig.concat([
               {
                    test: /\.js$/,
                    exclude: /(node_modules)/,
                    use: { loader: 'babel-loader', options: { presets: ['@babel/preset-env'] } }
               }
          ])
     }
}





switch (currentTask) {
     case "build":
          /* ---------- build ------------ */
          config.mode = 'production';
          cssConfig.forEach(el => {
               el.use.unshift(MiniCssExtractPlugin.loader)
          });

          config.output = {
               path: path.resolve(__dirname, 'public/assets'),
               filename: 'js/[name].[chunkhash].js',
               chunkFilename: 'js/[name].[chunkhash].js'
          };

          recursiveSync('./app/templates').filter(function(file) {
               return file.endsWith('.html') && !file.includes('archiv');
          }).map(function(page) {
               page = page.replace('app\\templates\\', '');
               page = page.replace(/\\/g, '/');
               config.plugins.push( new HtmlWebpackPlugin({
                    filename: `../templates/${page}`,
                    template: `./app/templates/${page}`,
                    publicPath: `/assets`,
                    minify: false
               }));
          });
          config.plugins.push(
               new CleanWebpackPlugin({
                    cleanOnceBeforeBuildPatterns: ['**/*', '!fonts/*', '!images/*'],
               }),
               new MiniCssExtractPlugin({
                    filename: 'css/styles.[chunkhash].css'
               })
          );

          config.module.rules.push(
               {
                    test: /\.(woff|woff2|eot|ttf|svg)$/i,
                    loader: 'url-loader',
                    options: {
                         name: '[name].[ext]',
                         outputPath: 'fonts',
                         publicPath: '/assets/fonts',
                         limit: 1024
                    }
               },
               {
                    test: /\.(png|jpe?g|gif)$/i,
                    loader: 'url-loader',
                    options: {
                         outputPath: 'images',
                         publicPath: '/assets/images',
                         limit: 1024
                    }
               }
          );

          config.optimization = { splitChunks: { chunks: 'all' } };

          
          postCSSPlugins.push(require('cssnano'));
          break;
          /* ----------------------------- */
     case "dev":
          /* ------------- dev ----------- */
          config.mode = 'development';
          cssConfig.forEach(el => {
               el.use.unshift(MiniCssExtractPlugin.loader)
          });

          config.output = {
               path: path.resolve(__dirname, 'public/assets'),
               filename: 'js/[name].[chunkhash].js',
               chunkFilename: 'js/[name].[chunkhash].js'
          };

          recursiveSync('./app/templates').filter(function(file) {
               return file.endsWith('.html') && !file.includes('archiv');
          }).map(function(page) {
               page = page.replace('app\\templates\\', '');
               page = page.replace(/\\/g, '/');
               config.plugins.push( new HtmlWebpackPlugin({
                    filename: `../templates/${page}`,
                    template: `./app/templates/${page}`,
                    publicPath: `/assets`,
                    minify: false
               }));
          });
          config.plugins.push(
               new CleanWebpackPlugin({
                    cleanOnceBeforeBuildPatterns: ['**/*', '!fonts/*', '!images/*'],
               }),
               new MiniCssExtractPlugin({
                    filename: 'css/styles.[chunkhash].css'
               })
          );

          config.module.rules.push(
               {
                    test: /\.(woff|woff2|eot|ttf|svg)$/i,
                    loader: 'url-loader',
                    options: {
                         name: '[name].[ext]',
                         outputPath: 'fonts',
                         publicPath: '/assets/fonts',
                         limit: 1024
                    }
               },
               {
                    test: /\.(png|jpe?g|gif)$/i,
                    loader: 'url-loader',
                    options: {
                         outputPath: 'images',
                         publicPath: '/assets/images',
                         limit: 1024
                    }
               }
          );
          config.optimization = { splitChunks: { chunks: 'all' } };
          break;
          /* ---------------------------------- */
     case "devl":
          /* --------------- devl ------------- */
          config.mode = 'development';
          cssConfig.forEach(el => {
               el.use.unshift('style-loader')
          });
          config.output = {
               path: path.resolve(__dirname, 'test_env'),
               filename: 'bundled.js'
          };

          recursiveSync('./test_env').filter(function(file) {
               return file.endsWith('.html') && !file.includes(file + '_files');
          }).map(function(page) {
               page = page.replace('test_env\\', '');
               page = page.replace(/\\/g, '/');
               config.plugins.push(new HtmlWebpackPlugin({
                    filename: page,
                    template: `./test_env/${page}`,
                    minify: false,
                    inject: "head"
               }));
          });

          config.module.rules.push(
               {
                    test: /\.(woff|woff2|eot|ttf|svg)$/i,
                    loader: 'url-loader'
               },
               {
                    test: /\.(png|jpe?g|gif)$/i,
                    loader: 'url-loader'
               }
          );

          config.devServer = {
               before: function(app, server) {
                    server._watch('./test_env/*.html');
               },
               contentBase: path.join(__dirname, 'test_env'),
               hot: true,
               port: 8095,
               host: '0.0.0.0'
          };
          break;
          /* -------------------------- */
     default:
          break;
}


module.exports = config;