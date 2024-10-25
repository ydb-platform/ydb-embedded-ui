import {
    createDeveloperUILinkWithNodeId,
    createPDiskDeveloperUILink,
    createVDiskDeveloperUILink,
} from '../developerUI';

describe('Developer UI links generators', () => {
    describe('createDeveloperUILinkWithNodeId', () => {
        it('should create relative link with no host', () => {
            expect(createDeveloperUILinkWithNodeId(1)).toBe('/node/1');
        });
        it('should create relative link with existing relative path with nodeId', () => {
            expect(createDeveloperUILinkWithNodeId(1, '/node/3/')).toBe('/node/1');
        });
        it('should create full link with host', () => {
            expect(
                createDeveloperUILinkWithNodeId(
                    1,
                    'http://ydb-vla-dev02-001.search.yandex.net:8765',
                ),
            ).toBe('http://ydb-vla-dev02-001.search.yandex.net:8765/node/1');
        });
        it('should create full link with host with existing node path with nodeId', () => {
            expect(
                createDeveloperUILinkWithNodeId(
                    1,
                    'http://ydb-vla-dev02-001.search.yandex.net:8765/node/3',
                ),
            ).toBe('http://ydb-vla-dev02-001.search.yandex.net:8765/node/1');
        });
    });
    describe('createPDiskDeveloperUILink', () => {
        it('should create link with pDiskId and nodeId', () => {
            expect(createPDiskDeveloperUILink({nodeId: 1, pDiskId: 1})).toBe(
                '/node/1/actors/pdisks/pdisk000000001',
            );
        });
    });
    describe('createVDiskDeveloperUILink', () => {
        it('should create link with pDiskId, vDiskSlotId nodeId', () => {
            expect(
                createVDiskDeveloperUILink({
                    nodeId: 1,
                    pDiskId: 1,
                    vDiskSlotId: 1,
                }),
            ).toBe('/node/1/actors/vdisks/vdisk000000001_000000001');
        });
    });
});
