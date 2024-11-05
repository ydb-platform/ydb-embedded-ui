import {
    createDeveloperUIInternalPageHref,
    createDeveloperUILinkWithNodeId,
    createPDiskDeveloperUILink,
    createVDiskDeveloperUILink,
} from '../developerUI';

describe('Developer UI links generators', () => {
    describe('createDeveloperUIInternalPageHref', () => {
        it('should create correct link for embedded UI', () => {
            expect(createDeveloperUIInternalPageHref('')).toBe('/internal');
        });
        it('should create correct link for embedded UI with node', () => {
            expect(createDeveloperUIInternalPageHref('/node/5')).toBe('/node/5/internal');
        });
        it('should create correct link for embedded UI with proxy', () => {
            expect(createDeveloperUIInternalPageHref('/my-ydb-host.net:8765')).toBe(
                '/my-ydb-host.net:8765/internal',
            );
        });
        it('should create correct link for UI with custom host', () => {
            expect(createDeveloperUIInternalPageHref('http://my-ydb-host.net:8765')).toBe(
                'http://my-ydb-host.net:8765/internal',
            );
        });
        it('should create correct link for UI with custom host and node', () => {
            expect(createDeveloperUIInternalPageHref('http://my-ydb-host.net:8765/node/5')).toBe(
                'http://my-ydb-host.net:8765/node/5/internal',
            );
        });
        it('should create correct link for UI with custom host and proxy', () => {
            expect(
                createDeveloperUIInternalPageHref('https://my-ydb-proxy/my-ydb-host.net:8765'),
            ).toBe('https://my-ydb-proxy/my-ydb-host.net:8765/internal');
        });
    });
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
