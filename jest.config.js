const config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/utils/(.*)$': '<rootDir>/utils/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/src/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  transformIgnorePatterns: ['/node_modules/(?!(nanoid|@sanity|uuid|@testing-library)/)'],
  collectCoverageFrom: [
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'utils/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  testMatch: [
    '**/test/contentRestriction.test.js',
    '**/test/performanceMonitor.test.js',
    '**/test/rateLimiter.test.js',
    '**/test/trendManagement.test.js',
    '**/test/vipMonitoring.test.js',
    '**/test/imageOptimizer.test.js',
  ],
}

module.exports = config
