module.exports = {
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
    },
  ],
  packagerConfig: {
    ignore: ['^\\/public$', '^\\/node_modules$', '^\\/.github$'],
    asar: true,
    tmpdir: 'C:\\tmp',
    overwrite: true,
  },
};
