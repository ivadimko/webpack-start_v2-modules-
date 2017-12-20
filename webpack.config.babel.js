/**
 * custom webpack command line flags supported (apart default flags, see https://webpack.js.org/api/cli/):
 *
 * - webpack --env.analyze
 *   adds webpack bundle analyzer plugin
 *
 * - webpack --env.template=[all|pageName|none]
 *   choose specific pug templates to build to increase performance
 */

import fs from 'fs';
import path from 'path';
import ExtractTextPlugin from 'extract-text-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import FaviconsWebpackPlugin from 'favicons-webpack-plugin';
import {BundleAnalyzerPlugin} from 'webpack-bundle-analyzer';
import webpack from 'webpack';



export default function (env = {}, argv) {
    const {analyze = false, template = 'all'} = env;
    const context = path.resolve(__dirname, './src/app');
    const templateEntriesDir = path.resolve(context, 'templates/pages');
    const pugFiles = fs.readdirSync(templateEntriesDir).map(file => file.split('.pug')[0]);
    let templates = [];
    if (template === 'all') {
        templates = pugFiles;
    } else {
        templates = pugFiles.filter(file => file === template);
    }
    return {
        context: context,
        devServer: {
            contentBase: path.resolve(__dirname, 'assets')
        },
        devtool: 'cheap-module-eval-source-map',
        entry: {
            'js/main': './js/main.js'
        },
        externals: {
            jquery: "jQuery"
        },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /(node_modules)/,
                    include: path.resolve(context, 'js'),
                    loader: 'babel-loader',
                    options: {
                        presets: ['env'],
                        plugins: [
                            'transform-object-rest-spread',
                            'transform-es2015-spread'
                        ]
                    }
                },
                {
                    test: /\.s?css$/,
                    exclude: /(node_modules)/,
                    // include: path.resolve(context, 'css'),
                    use: ExtractTextPlugin.extract({
                        fallback: 'style-loader',
                        use: [
                            {
                                loader: 'css-loader',
                                options: {
                                    // https://github.com/webpack-contrib/css-loader/issues/228#issuecomment-204607491
                                    importLoaders: 3,
                                    sourceMap: true
                                }
                            },
                            {
                                loader: 'postcss-loader',
                                options: {
                                    plugins: () => [
                                        require('autoprefixer'),
                                        require('postcss-sorting')
                                    ],
                                    sourceMap: true
                                }
                            },
                            'resolve-url-loader',
                            {
                                loader: 'sass-loader',
                                options: {
                                    outputStyle: 'compact',
                                    sourceMap: true,
                                    sourceComments: true
                                }
                            }
                        ]
                    })
                },
                {
                    test: /\.(ttf|woff|eot)$/,
                    include: path.resolve(context, 'fonts'),
                    loader: 'file-loader',
                    options: {
                        name: '[name].[ext]',
                        outputPath: './assets/fonts',
                        useRelativePath: true
                    }
                },
                {
                    test: /\.svg$/,
                    exclude: path.resolve(context, 'images/inline'),
                    loader: 'file-loader',
                    options: {
                        name: '[path][name].[ext]'
                    }
                },
                ...template !== 'none' && [
                    {
                        test: /\.pug$/,
                        loader: 'pug-loader',
                        options: {
                            pretty: true
                        }
                    },
                    {
                        test: /.*\.(gif|png|jpe?g)$/i,
                        // include: path.resolve(context, 'images'),
                        use: [
                            {
                                loader: 'file-loader',
                                options: {
                                    name: '[path][name]__[sha512:hash:base64:5].[ext]'
                                }
                            },
                            {
                                loader: 'image-webpack-loader',
                                options: {
                                    mozjpeg: {
                                        quality: 85
                                    }
                                }
                            }
                        ]
                    },
                    {
                        test: /\.svg$/,
                        include: path.resolve(context, 'images/inline'),
                        loader: 'svg-inline-loader',
                        options: {
                            removeTags: true,
                            removingTags: ['title', 'desc', 'style']
                        }
                    },
                    {
                        test: /\.mp4$/,
                        loader: 'file-loader',
                        // include: path.resolve(context, 'video'),
                        options: {
                            name: '[path][name].[ext]'
                        }
                    }
                ]
            ]
        },
        output: {
            filename: '[name].js',
            path: path.resolve(__dirname, 'assets')
        },
        plugins: [
            new ExtractTextPlugin('css/main.css'),
            new webpack.optimize.CommonsChunkPlugin({
                async: true,
                name: "manifest",
                minChunks: Infinity
            }),
            ...analyze && [new BundleAnalyzerPlugin],
            ...template !== 'none' && [
                // new FaviconsWebpackPlugin({
                //     logo: './images/favicon.png',
                //     prefix: 'favicon/',
                //     persistentCache: true,
                //     inject: true,
                //     background: '#fff',
                //     icons: {
                //         android: true,
                //         appleIcon: true,
                //         appleStartup: true,
                //         coast: false,
                //         favicons: true,
                //         firefox: true,
                //         opengraph: false,
                //         twitter: false,
                //         yandex: false,
                //         windows: true
                //     }
                // }),
                ...templates.map(file =>
                    new HtmlWebpackPlugin({
                        filename: `${file}.html`,
                        template: `${templateEntriesDir}/${file}.pug`,
                        minify: false
                    })
                )
            ]
        ],
        resolve: {
            alias: {
                'masonry': 'masonry-layout',
                'isotope': 'isotope-layout'
            }
        }
    }
}