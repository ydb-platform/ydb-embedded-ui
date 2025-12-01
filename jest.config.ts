import type {Config} from 'jest';

const config: Config = {
    verbose: true,

    testEnvironment: 'jsdom',
    testEnvironmentOptions: {
        url: 'http://localhost:3000',
    },

    setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
    roots: ['<rootDir>/src', '<rootDir>/.github'],
    testMatch: [
        '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
        '<rootDir>/src/**/*.{spec,test}.{js,jsx,ts,tsx}',
        '<rootDir>/.github/**/*.{spec,test}.{js,jsx,ts,tsx}',
    ],
    moduleFileExtensions: ['js', 'json', 'ts', 'tsx'],
    moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'jest-transform-css',
    },

    transform: {
        '^.+\\.(ts|tsx|js|jsx)$': 'babel-jest',
    },
    transformIgnorePatterns: [
        'node_modules/(?!(@gravity-ui|nanoid|uuid|shiki|@shikijs|@mjackson|@standard-schema)/)',
    ],

    coverageDirectory: './coverage',
    collectCoverageFrom: ['src/**/*.{ts,tsx,js,jsx}'],
};

export default config;
