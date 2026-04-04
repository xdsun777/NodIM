import { defineConfig } from '@rspack/cli';
import {
  type RspackPluginFunction,
  rspack,
  type SwcLoaderOptions,
} from '@rspack/core';

import { VueLoaderPlugin } from 'rspack-vue-loader';
import { RsdoctorRspackPlugin } from '@rsdoctor/rspack-plugin';

import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const __dirname = path.join(dirname(fileURLToPath(import.meta.url)), './');
const targets = ['last 2 versions', '> 0.2%', 'not dead', 'Firefox ESR'];

export default defineConfig({
  context: __dirname,
  entry: {
    main: './src/main.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
    publicPath: '/',
  },
  resolve: {
    extensions: ['.ts', '.vue', '.css', '.json', '.js'],
    alias: {
      // 必须和 tsconfig.json 的 paths 对齐：@ -> src
      '@': path.resolve(__dirname, './src'),
    },
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'rspack-vue-loader',
        options: {
          experimentalInlineMatchResource: true,
        },
      },
      {
        test: /\.(js|ts)$/,
        use: [
          {
            loader: 'builtin:swc-loader',
            options: {
              jsc: {
                parser: {
                  syntax: 'typescript',
                },
              },
              env: { targets },
            } satisfies SwcLoaderOptions,
          },
        ],
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: 'builtin:lightningcss-loader',
            options: {
              targets: ['chrome >= 87', 'edge >= 88', '> 0.5%'],
            },
          },
          'postcss-loader',
        ],
      },
      {
        test: /\.(png|svg|jpg|wasm|woff2)$/,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new rspack.HtmlRspackPlugin({
      template: './src/public/index.html',
    }),
    new rspack.DefinePlugin({
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: true,
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'true',
    }),
    new VueLoaderPlugin() as RspackPluginFunction,
    process.env.RSDOCTOR &&
      new RsdoctorRspackPlugin({
        // 插件选项
      }),
  ],
  optimization: {
    minimizer: [
      new rspack.SwcJsMinimizerRspackPlugin(),
      new rspack.LightningCssMinimizerRspackPlugin({
        minimizerOptions: { targets },
      }),
    ],
  },
  // 关键配置：解决 History 模式刷新 404
  devServer: {
    port: 8080,
    // 所有 404 请求都重定向到 index.html
    historyApiFallback: {
      index: '/index.html',
    },
    // 可选：开启热更新，提升开发体验
    hot: true,
    open: true,
  },
  experiments: {
    css: true,
    asyncWebAssembly: true,
  },
});
