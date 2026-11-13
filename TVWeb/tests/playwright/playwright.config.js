const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './specs',
  timeout: 60000,
  expect: { timeout: 12000 },
  workers: 1,
  retries: 0,
  use: {
    baseURL: process.env.TVWEB_URL || 'http://localhost:5125',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  reporter: [
    ['list'],
    ['json', { outputFile: './reports/results.json' }],
    ['html', { outputFolder: './reports/html', open: 'never' }]
  ],
  outputDir: './reports/artifacts'
});