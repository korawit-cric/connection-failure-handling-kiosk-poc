module.exports = {
  typescript: true,
  svgo: true,
  svgoConfig: {
    plugins: [
      {
        name: 'preset-default',
        params: {
          overrides: {
            removeViewBox: false,
          },
        },
      },
    ],
  },
  replaceAttrValues: {
    '#000': 'currentColor',
    '#000000': 'currentColor',
  },
  icon: true,
  dimensions: false,
};
