module.exports = {
  sourceMaps: true,
  plugins: [
    [
      'module-resolver',
      {
        alias: {
          crypto: 'crypto-browserify'
        }
      }
    ]
  ]
}
