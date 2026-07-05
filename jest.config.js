const nextJest = require('next/jest')

const createJestConfig = nextJest({ dir: './' })

/** @type {import('jest').Config} */
const customJestConfig = {
  testEnvironment: 'node',
  moduleNameMapper: {
    '^src/lib/supabaseServer$': '<rootDir>/test/mocks/supabaseServer.js',
    '^(\\.{1,2}/.*)/lib/supabaseServer$': '<rootDir>/test/mocks/supabaseServer.js',
  },
  collectCoverageFrom: [
    'pages/api/**/*.{js,ts}',
  ],
  testMatch: ['**/__tests__/**/*.test.{js,ts}'],
  modulePathIgnorePatterns: ['<rootDir>/safe_copy/', '<rootDir>/docs/', '<rootDir>/kmb_docs_for_decsoft/'],
}

module.exports = createJestConfig(customJestConfig)
