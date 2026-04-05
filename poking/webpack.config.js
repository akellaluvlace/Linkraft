const path = require('path');

module.exports = {
  mode: 'production',
  entry: './src/overlay/inspector.ts',
  output: {
    filename: 'overlay.js',
    path: path.resolve(__dirname, 'dist'),
    library: {
      name: 'PokeOverlay',
      type: 'var',
    },
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: path.resolve(__dirname, 'tsconfig.overlay.json'),
            },
          },
        ],
        exclude: /node_modules/,
      },
    ],
  },
  performance: {
    maxAssetSize: 50000,
    hints: 'warning',
  },
};
