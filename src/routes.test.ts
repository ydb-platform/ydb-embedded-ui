jest.mock('./store', () => ({
    backend: undefined,
    basename: '/monitoring',
    clusterName: undefined,
    environment: undefined,
    webVersion: false,
}));

jest.mock('./uiFactory/uiFactory', () => ({
    uiFactory: {clustersDomain: undefined},
}));

jest.mock('./utils/hooks/useDatabaseFromQuery', () => ({
    useDatabaseFromQuery: jest.fn(),
}));

import {getPDiskPagePath} from './routes';

describe('routes', () => {
    describe('getPDiskPagePath', () => {
        test('should create pDisk path without basename by default', () => {
            expect(getPDiskPagePath(1001, 4)).toBe('/pDisk?nodeId=4&pDiskId=1001');
        });

        test('should prepend basename when requested for href-based links', () => {
            expect(getPDiskPagePath(1001, 4, undefined, {withBasename: true})).toBe(
                '/monitoring/pDisk?nodeId=4&pDiskId=1001',
            );
        });
    });
});
