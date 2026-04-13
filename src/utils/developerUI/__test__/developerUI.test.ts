import type {YdbEmbeddedAPI} from '../../../services/api';
import {configureUIFactory} from '../../../uiFactory/uiFactory';
import {
    createDeveloperUIInternalPageHref,
    createDeveloperUILinkWithNodeId,
    createDeveloperUIMonitoringPageHref,
    createPDiskDeveloperUILink,
    createTabletDeveloperUIHref,
    createVDiskDeveloperUILink,
} from '../developerUI';

describe('Developer UI links generators', () => {
    beforeAll(() => {
        const api = {
            viewer: {
                getPath: jest.fn(() => ''),
            },
        };
        window.api = api as unknown as YdbEmbeddedAPI;
    });

    beforeEach(() => {
        configureUIFactory({developerUiFirstPathSegment: undefined});
        jest.mocked(window.api.viewer.getPath).mockReturnValue('');
    });

    describe('createDeveloperUIInternalPageHref', () => {
        test('should create correct link for embedded UI', () => {
            expect(createDeveloperUIInternalPageHref('')).toBe('/internal');
        });
        test('should create correct link for embedded UI with node', () => {
            expect(createDeveloperUIInternalPageHref('/node/5')).toBe('/node/5/internal');
        });
        test('should create correct link for embedded UI with proxy', () => {
            expect(createDeveloperUIInternalPageHref('/my-ydb-host.net:8765')).toBe(
                '/my-ydb-host.net:8765/internal',
            );
        });
        test('should create correct link for UI with custom host', () => {
            expect(createDeveloperUIInternalPageHref('http://my-ydb-host.net:8765')).toBe(
                'http://my-ydb-host.net:8765/internal',
            );
        });
        test('should create correct link for UI with custom host and node', () => {
            expect(createDeveloperUIInternalPageHref('http://my-ydb-host.net:8765/node/5')).toBe(
                'http://my-ydb-host.net:8765/node/5/internal',
            );
        });
        test('should create correct link for UI with custom host and proxy', () => {
            expect(
                createDeveloperUIInternalPageHref('https://my-ydb-proxy/my-ydb-host.net:8765'),
            ).toBe('https://my-ydb-proxy/my-ydb-host.net:8765/internal');
        });
    });
    describe('createDeveloperUILinkWithNodeId', () => {
        test('should create relative link with no host', () => {
            expect(createDeveloperUILinkWithNodeId(1)).toBe('/node/1');
        });
        test('should strip existing node path from current host when no firstSegment', () => {
            jest.mocked(window.api.viewer.getPath).mockReturnValue('/node/3');
            expect(createDeveloperUILinkWithNodeId(1)).toBe('/node/1');
        });
        test('should strip existing node path from current absolute host when no firstSegment', () => {
            jest.mocked(window.api.viewer.getPath).mockReturnValue(
                'http://my-ydb-host.net:8765/node/3',
            );
            expect(createDeveloperUILinkWithNodeId(1)).toBe('http://my-ydb-host.net:8765/node/1');
        });
        test('should create relative link with existing relative path with nodeId', () => {
            expect(createDeveloperUILinkWithNodeId(1, '/node/3/')).toBe('/node/1');
        });
        test('should create full link with host', () => {
            expect(
                createDeveloperUILinkWithNodeId(
                    1,
                    'http://ydb-vla-dev02-001.search.yandex.net:8765',
                ),
            ).toBe('http://ydb-vla-dev02-001.search.yandex.net:8765/node/1');
        });
        test('should create full link with host with existing node path with nodeId', () => {
            expect(
                createDeveloperUILinkWithNodeId(
                    1,
                    'http://ydb-vla-dev02-001.search.yandex.net:8765/node/3',
                ),
            ).toBe('http://ydb-vla-dev02-001.search.yandex.net:8765/node/1');
        });
    });
    describe('createPDiskDeveloperUILink', () => {
        test('should create link with pDiskId and nodeId', () => {
            expect(createPDiskDeveloperUILink({nodeId: 1, pDiskId: 1})).toBe(
                '/node/1/actors/pdisks/pdisk000000001',
            );
        });
    });
    describe('createVDiskDeveloperUILink', () => {
        test('should create link with pDiskId, vDiskSlotId nodeId', () => {
            expect(
                createVDiskDeveloperUILink({
                    nodeId: 1,
                    pDiskId: 1,
                    vDiskSlotId: 1,
                }),
            ).toBe('/node/1/actors/vdisks/vdisk000000001_000000001');
        });
    });

    describe('createDeveloperUIMonitoringPageHref', () => {
        test('should create correct link for embedded UI', () => {
            expect(createDeveloperUIMonitoringPageHref('')).toBe('/monitoring');
        });
        test('should create correct link with custom host', () => {
            expect(createDeveloperUIMonitoringPageHref('http://my-ydb-host.net:8765')).toBe(
                'http://my-ydb-host.net:8765/monitoring',
            );
        });
    });

    describe('createTabletDeveloperUIHref', () => {
        test('should create correct link with tabletId', () => {
            expect(createTabletDeveloperUIHref(123, undefined, 'TabletID', '')).toBe(
                '/tablets?TabletID=123',
            );
        });
        test('should create correct link with tabletId and page', () => {
            expect(createTabletDeveloperUIHref(123, 'counters', 'TabletID', '')).toBe(
                '/tablets/counters?TabletID=123',
            );
        });
        test('should create correct link with custom host', () => {
            expect(
                createTabletDeveloperUIHref(
                    123,
                    undefined,
                    'TabletID',
                    'http://my-ydb-host.net:8765',
                ),
            ).toBe('http://my-ydb-host.net:8765/tablets?TabletID=123');
        });
    });

    describe('developerUiFirstPathSegment', () => {
        describe('createDeveloperUIInternalPageHref', () => {
            test('should insert first segment when configured', () => {
                configureUIFactory({developerUiFirstPathSegment: 'custom'});
                expect(createDeveloperUIInternalPageHref()).toBe('/custom/internal');
            });

            test('should keep explicit custom host unchanged', () => {
                configureUIFactory({developerUiFirstPathSegment: 'custom'});
                expect(createDeveloperUIInternalPageHref('http://my-ydb-host.net:8765')).toBe(
                    'http://my-ydb-host.net:8765/internal',
                );
            });

            test('should keep explicit custom host with existing path unchanged', () => {
                configureUIFactory({developerUiFirstPathSegment: 'custom'});
                expect(
                    createDeveloperUIInternalPageHref('http://my-ydb-host.net:8765/node/5'),
                ).toBe('http://my-ydb-host.net:8765/node/5/internal');
            });

            test('should keep explicit proxy path unchanged', () => {
                configureUIFactory({developerUiFirstPathSegment: 'api'});
                expect(createDeveloperUIInternalPageHref('/my-ydb-host.net:8765')).toBe(
                    '/my-ydb-host.net:8765/internal',
                );
            });

            test('should append first segment after existing relative path from current host', () => {
                configureUIFactory({developerUiFirstPathSegment: 'api'});
                jest.mocked(window.api.viewer.getPath).mockReturnValue('/node/5');
                expect(createDeveloperUIInternalPageHref()).toBe('/node/5/api/internal');
            });

            test('should append first segment after existing absolute path from current host', () => {
                configureUIFactory({developerUiFirstPathSegment: 'custom'});
                jest.mocked(window.api.viewer.getPath).mockReturnValue(
                    'http://my-ydb-host.net:8765/node/5',
                );
                expect(createDeveloperUIInternalPageHref()).toBe(
                    'http://my-ydb-host.net:8765/node/5/custom/internal',
                );
            });

            test('should append first segment after proxy cluster path from current host', () => {
                configureUIFactory({developerUiFirstPathSegment: 'devui'});
                jest.mocked(window.api.viewer.getPath).mockReturnValue(
                    '/api/meta3/proxy/cluster/ru-central1',
                );
                expect(createDeveloperUIInternalPageHref()).toBe(
                    '/api/meta3/proxy/cluster/ru-central1/devui/internal',
                );
            });
        });

        describe('createDeveloperUIMonitoringPageHref', () => {
            test('should insert first segment when configured', () => {
                configureUIFactory({developerUiFirstPathSegment: 'custom'});
                expect(createDeveloperUIMonitoringPageHref()).toBe('/custom/monitoring');
            });

            test('should keep explicit custom host unchanged', () => {
                configureUIFactory({developerUiFirstPathSegment: 'api'});
                expect(createDeveloperUIMonitoringPageHref('http://my-ydb-host.net:8765')).toBe(
                    'http://my-ydb-host.net:8765/monitoring',
                );
            });
        });

        describe('createDeveloperUILinkWithNodeId', () => {
            test('should insert first segment when configured', () => {
                configureUIFactory({developerUiFirstPathSegment: 'custom'});
                expect(createDeveloperUILinkWithNodeId(1)).toBe('/custom/node/1');
            });

            test('should keep explicit custom host unchanged', () => {
                configureUIFactory({developerUiFirstPathSegment: 'api'});
                expect(
                    createDeveloperUILinkWithNodeId(
                        1,
                        'http://ydb-vla-dev02-001.search.yandex.net:8765',
                    ),
                ).toBe('http://ydb-vla-dev02-001.search.yandex.net:8765/node/1');
            });

            test('should replace nodeId in path with first segment', () => {
                configureUIFactory({developerUiFirstPathSegment: 'custom'});
                expect(createDeveloperUILinkWithNodeId(1, '/custom/node/3')).toBe('/custom/node/1');
            });

            test('should strip existing node path and append first segment before adding node path', () => {
                configureUIFactory({developerUiFirstPathSegment: 'custom'});
                jest.mocked(window.api.viewer.getPath).mockReturnValue(
                    'http://my-ydb-host.net:8765/node/3',
                );
                expect(createDeveloperUILinkWithNodeId(1)).toBe(
                    'http://my-ydb-host.net:8765/custom/node/1',
                );
            });
        });

        describe('createPDiskDeveloperUILink', () => {
            test('should insert first segment when configured', () => {
                configureUIFactory({developerUiFirstPathSegment: 'custom'});
                expect(createPDiskDeveloperUILink({nodeId: 1, pDiskId: 1})).toBe(
                    '/custom/node/1/actors/pdisks/pdisk000000001',
                );
            });
        });

        describe('createVDiskDeveloperUILink', () => {
            test('should insert first segment when configured', () => {
                configureUIFactory({developerUiFirstPathSegment: 'custom'});
                expect(
                    createVDiskDeveloperUILink({
                        nodeId: 1,
                        pDiskId: 1,
                        vDiskSlotId: 1,
                    }),
                ).toBe('/custom/node/1/actors/vdisks/vdisk000000001_000000001');
            });
        });

        describe('createTabletDeveloperUIHref', () => {
            test('should insert first segment when configured', () => {
                configureUIFactory({developerUiFirstPathSegment: 'custom'});
                expect(createTabletDeveloperUIHref(123)).toBe('/custom/tablets?TabletID=123');
            });

            test('should insert first segment with tablet page', () => {
                configureUIFactory({developerUiFirstPathSegment: 'api'});
                expect(createTabletDeveloperUIHref(123, 'counters')).toBe(
                    '/api/tablets/counters?TabletID=123',
                );
            });

            test('should keep explicit custom host unchanged', () => {
                configureUIFactory({developerUiFirstPathSegment: 'custom'});
                expect(
                    createTabletDeveloperUIHref(
                        123,
                        undefined,
                        'TabletID',
                        'http://my-ydb-host.net:8765',
                    ),
                ).toBe('http://my-ydb-host.net:8765/tablets?TabletID=123');
            });

            test('should normalize first segment slashes', () => {
                configureUIFactory({developerUiFirstPathSegment: '/custom/'});
                expect(createTabletDeveloperUIHref(123)).toBe('/custom/tablets?TabletID=123');
            });
        });
    });
});
