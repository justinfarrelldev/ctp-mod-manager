/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    testPathIgnorePatterns: ['<rootDir>/node_modules', '<rootDir>/dist'],
    setupFilesAfterEnv: ['<rootDir>/src/setup-tests.ts'],
    runner: 'groups',
};
