import config from '@repo/eslint-config/prettier-base';

/** @type {import('prettier').Config & import('prettier-plugin-tailwindcss').PluginOptions} */
const prettierConfig = {
  ...config,
  plugins: ['prettier-plugin-tailwindcss'],
};
export default prettierConfig;
