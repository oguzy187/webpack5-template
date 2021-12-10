const currentTask = process.env.npm_lifecycle_event
const path = require('path')
const webpack = require('webpack');
const {CleanWebpackPlugin} = require('clean-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
// const PreloadWebpackPlugin = require('@vue/preload-webpack-plugin');
const recursiveSync = require('recursive-readdir-sync')


const postCSSPlugins = [
     require('postcss-import'),
     require('postcss-url')(currentTask === "devl" ? {url: 'inline',ignoreFragmentWarning: true} : {}),
     require('postcss-mixins'),
     require('postcss-simple-vars'),
     require('postcss-nested'),
     require('postcss-hexrgba')
];

const commonPostCSSPlugins = [
     require('autoprefixer')
];


let cssConfig = [
     {
          test: /\.p?css$/i,
          use: [
               currentTask === "devl" ? "style-loader" : MiniCssExtractPlugin.loader,
               'css-loader',
               { loader: 'postcss-loader', options: { postcssOptions: { plugins: postCSSPlugins } } }
          ]
     },
     {
          test: /\.s(a|c)+ss$/i,
          use: [
               currentTask === "devl" ? "style-loader" : MiniCssExtractPlugin.loader,
               'css-loader',
               'resolve-url-loader',
               { loader: 'postcss-loader', options: { postcssOptions: { plugins: commonPostCSSPlugins } } },
               'sass-loader'
          ]
     },
     {
          test: /\.less$/i,
          use: [
               currentTask === "devl" ? "style-loader" : MiniCssExtractPlugin.loader,
               'css-loader',
               'resolve-url-loader',
               { loader: 'postcss-loader', options: { postcssOptions: { plugins: commonPostCSSPlugins } } },
               'less-loader'
          ]
     }
];



let config = {
     entry: './app/assets/scripts/App.js',
     resolve: { 
          alias: {
               thirdparty: path.resolve(__dirname, 'app/assets/third-party/') 
          }
     },
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

config.mode = currentTask === "build" ? 'production' : 'development';

if (currentTask !== "devl") {
     /* ---------- static ------------ */
     config.output = {
          path: path.resolve(__dirname, 'public/assets'),
          filename: 'js/[name].[chunkhash].js',
          chunkFilename: 'js/[name].[chunkhash].js'
     };

     if (currentTask === "dev") {
          config.devtool = false;
          config.plugins.push(new webpack.SourceMapDevToolPlugin({
               filename: "sourcemaps/[file].map"
          }));
     }

     recursiveSync('./app/templates')
     .filter(file => file.endsWith('.html') && !file.includes('archiv'))
     .forEach(function(page) {
          page = page.replace('app\\templates\\', '');
          page = page.replace(/\\/g, '/');
          config.plugins.push( 
               new HtmlWebpackPlugin({
                    filename: `../templates/${page}`,
                    template: `./app/templates/${page}`,
                    publicPath: `/assets`,
                    minify: {
                         collapseWhitespace: true,
                         keepClosingSlash: true,
                         removeComments: false,
                         removeRedundantAttributes: true,
                         removeScriptTypeAttributes: true,
                         removeStyleLinkTypeAttributes: true,
                         useShortDoctype: true
                    },
                    scriptLoading: 'blocking'
               })
          );
     });

     config.plugins.push(
          /* new PreloadWebpackPlugin({
               rel: 'preload',
               as: (entry) => { if (/\.(woff|woff2|eot|ttf|svg)$/.test(entry)) return 'font' },
               fileWhitelist: [/\.(woff2)$/],
               fileBlacklist: [/fa-\w+-\d+\.(woff|woff2|eot|ttf|svg)$/],
               include: 'allAssets'
          }), */
          new CleanWebpackPlugin(),
          new MiniCssExtractPlugin({
               filename: 'css/styles.[contenthash].css'
          })
     );

     config.module.rules.push(
          {
               test: /\.(woff|woff2|eot|ttf|svg)$/i,
               type: 'asset',
               parser: { dataUrlCondition: { maxSize: 1024 } },
               generator: { filename: 'fonts/[name][ext]' }
          },
          {
               test: /\.(png|jpe?g|gif)$/i,
               type: 'asset',
               parser: { dataUrlCondition: { maxSize: 1024 } },
               generator: { filename: 'images/[hash][ext]' }
          }
     );

  

     config.optimization = { 
          splitChunks: {
               chunks: 'all'/* ,
               cacheGroups: {
                    vendor: {
                         test: /[\\/]node_modules[\\/]/,
                         name: "vendor"
                    }
               } */
          } 
     };

     if (currentTask === "build") commonPostCSSPlugins.push(require('cssnano')); // Zurzeite verbugged ohne cssnano..
     /* ----------------------------- */
} else {
     /* --------------- devl ------------- */
     config.output = {
          path: path.resolve(__dirname, 'test_env'),
          filename: 'bundled.js'
     };

     config.devtool = false;
     config.plugins.push(new webpack.SourceMapDevToolPlugin({
          filename: "sourcemaps/[file].map"
     }));

     recursiveSync('./test_env')
     .filter(file => file.endsWith('.html') && !file.includes(file + '_files'))
     .forEach(function(page) {
          page = page.replace('test_env\\', '');
          page = page.replace(/\\/g, '/');
          config.plugins.push(new HtmlWebpackPlugin({
               filename: page,
               template: `./test_env/${page}`,
               inject: "head"
          }));
     });

     config.module.rules.push(
          {
               test: /\.(woff|woff2|eot|ttf|svg)$/i,
               type: 'asset/inline',
          },
          {
               test: /\.(png|jpe?g|gif)$/i,
               type: 'asset/inline',
          }
     );

     config.devServer = {
          static: {
               directory: path.join(__dirname, 'test_env'),
               watch: true
          },
          open: true,
          hot: true,
          port: 8095
     };
     /* -------------------------- */
}

commonPostCSSPlugins.forEach((plugin) => postCSSPlugins.push(plugin));



module.exports = config;