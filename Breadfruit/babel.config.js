module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'], // ✅ same as tsconfig
        alias: {
          '@': './src',
          '@screens': './src/screens',
                    '@utils': './src/utils',
        },
      },
    ],
    [
      'module:react-native-dotenv',
      {
        moduleName: '@env',
        path: '.env',
      },
    ],
     'react-native-reanimated/plugin',
  ],
};
