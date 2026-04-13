import type {ClusterInfo} from '../../../store/reducers/cluster/cluster';
import type {ClusterLink} from '../../../types/additionalProps';
import type {MetaClusterLink} from '../../../types/api/meta';
import {resolveClusterLinks, substituteUrlParams} from '../resolveClusterLinks';

/** Helper to build a minimal ClusterInfo with the given overrides */
function makeClusterInfo(overrides: Partial<ClusterInfo> = {}): ClusterInfo {
    return {
        balancer: 'https://balancer.example.com',
        name: 'my-cluster',
        ...overrides,
    } as ClusterInfo;
}

describe('substituteUrlParams', () => {
    test('replaces all placeholders with matching string values', () => {
        expect(
            substituteUrlParams('https://example.com/{cluster}/{env}', {
                cluster: 'my-cluster',
                env: 'prod',
            }),
        ).toBe('https://example.com/my-cluster/prod');
    });

    test('returns undefined when a placeholder has no matching param', () => {
        expect(
            substituteUrlParams('https://example.com/{cluster}/{missing}', {cluster: 'my-cluster'}),
        ).toBeUndefined();
    });

    test('returns the URL as-is when there are no placeholders', () => {
        expect(substituteUrlParams('https://example.com/static', {cluster: 'my-cluster'})).toBe(
            'https://example.com/static',
        );
    });

    test('returns the URL when all placeholders are resolved even with extra params', () => {
        expect(
            substituteUrlParams('https://example.com/{name}', {name: 'test', extra: 'unused'}),
        ).toBe('https://example.com/test');
    });

    test('handles empty source object with no placeholders', () => {
        expect(substituteUrlParams('https://example.com', {})).toBe('https://example.com');
    });

    test('returns undefined for empty source with placeholders', () => {
        expect(substituteUrlParams('https://example.com/{id}', {})).toBeUndefined();
    });

    test('ignores non-string values in source object', () => {
        expect(
            substituteUrlParams('https://example.com/{name}/{count}', {
                name: 'test',
                count: 42,
                data: {nested: true},
            }),
        ).toBeUndefined();
    });

    test('uses only string values for substitution', () => {
        expect(
            substituteUrlParams('https://example.com/{name}', {
                name: 'test',
                scale: 1,
                settings: {use_meta_proxy: false},
            }),
        ).toBe('https://example.com/test');
    });
});

describe('resolveClusterLinks', () => {
    const defaultLegacyClusterInfo = makeClusterInfo({
        cores: {url: 'https://cores.example.com'},
        logging: {url: 'https://logging.example.com', slo_logs_url: 'https://slo.example.com'},
    });

    describe('legacy links from cluster info', () => {
        test('builds legacy links from cores and logging fields', () => {
            const result = resolveClusterLinks(defaultLegacyClusterInfo);

            expect(result).toHaveLength(3);
            expect(result[0]).toEqual(
                expect.objectContaining({
                    title: 'Coredumps',
                    url: 'https://cores.example.com',
                }),
            );
            expect(result[1]).toEqual(
                expect.objectContaining({
                    title: 'Logging',
                    url: 'https://logging.example.com',
                }),
            );
            expect(result[2]).toEqual(
                expect.objectContaining({
                    title: 'SLO Logs',
                    url: 'https://slo.example.com',
                }),
            );
        });

        test('returns empty array when cluster info has no links, cores, or logging', () => {
            const result = resolveClusterLinks(makeClusterInfo());
            expect(result).toHaveLength(0);
        });

        test('legacy links have icons from context map', () => {
            const result = resolveClusterLinks(defaultLegacyClusterInfo);

            for (const link of result) {
                expect(link.icon).toBeDefined();
            }
        });
    });

    describe('dynamic links processing', () => {
        test('processes cluster type links with successful URL substitution', () => {
            const dynamicLinks: MetaClusterLink[] = [
                {
                    type: 'cluster',
                    url: 'https://logs.example.com/{name}',
                    context: 'logging',
                    title: 'My Logs',
                },
            ];

            const result = resolveClusterLinks(makeClusterInfo({links: dynamicLinks}));

            expect(result).toHaveLength(1);
            expect(result[0]).toEqual(
                expect.objectContaining({
                    title: 'My Logs',
                    url: 'https://logs.example.com/my-cluster',
                }),
            );
        });

        test('skips links with non-cluster type', () => {
            const dynamicLinks: MetaClusterLink[] = [
                {type: 'database', url: 'https://db.example.com', title: 'DB Link'},
            ];

            const result = resolveClusterLinks(makeClusterInfo({links: dynamicLinks}));
            expect(result).toHaveLength(0);
        });

        test('skips links with unresolvable URL placeholders', () => {
            const dynamicLinks: MetaClusterLink[] = [
                {
                    type: 'cluster',
                    url: 'https://example.com/{unknown_param}',
                    context: 'logging',
                    title: 'Bad Link',
                },
            ];

            const result = resolveClusterLinks(makeClusterInfo({links: dynamicLinks}));
            expect(result).toHaveLength(0);
        });

        test('skips links without title and without known context', () => {
            const dynamicLinks: MetaClusterLink[] = [{type: 'cluster', url: 'https://example.com'}];

            const result = resolveClusterLinks(makeClusterInfo({links: dynamicLinks}));
            expect(result).toHaveLength(0);
        });

        test('uses default title from context when title is not provided', () => {
            const dynamicLinks: MetaClusterLink[] = [
                {type: 'cluster', url: 'https://example.com', context: 'logging'},
            ];

            const result = resolveClusterLinks(makeClusterInfo({links: dynamicLinks}));

            expect(result).toHaveLength(1);
            expect(result[0].title).toBe('Logging');
        });

        test('uses explicit title over context default title', () => {
            const dynamicLinks: MetaClusterLink[] = [
                {
                    type: 'cluster',
                    url: 'https://example.com',
                    context: 'logging',
                    title: 'Custom Title',
                },
            ];

            const result = resolveClusterLinks(makeClusterInfo({links: dynamicLinks}));

            expect(result).toHaveLength(1);
            expect(result[0].title).toBe('Custom Title');
        });

        test('assigns icon based on context', () => {
            const dynamicLinks: MetaClusterLink[] = [
                {type: 'cluster', url: 'https://example.com', context: 'cores', title: 'Cores'},
            ];

            const result = resolveClusterLinks(makeClusterInfo({links: dynamicLinks}));

            expect(result).toHaveLength(1);
            expect(result[0].icon).toBeDefined();
        });

        test('no icon for unknown context', () => {
            const dynamicLinks: MetaClusterLink[] = [
                {type: 'cluster', url: 'https://example.com', context: 'unknown', title: 'Unknown'},
            ];

            const result = resolveClusterLinks(makeClusterInfo({links: dynamicLinks}));

            expect(result).toHaveLength(1);
            expect(result[0].icon).toBeUndefined();
        });
    });

    describe('context override rules', () => {
        test('dynamic logging link suppresses legacy logging link', () => {
            const dynamicLinks: MetaClusterLink[] = [
                {
                    type: 'cluster',
                    url: 'https://new-logging.example.com/{name}',
                    context: 'logging',
                    title: 'New Logging',
                },
            ];

            const result = resolveClusterLinks(
                makeClusterInfo({
                    links: dynamicLinks,
                    logging: {url: 'https://logging.example.com'},
                }),
            );

            const loggingLinks = result.filter(
                (l) => l.title === 'Logging' || l.title === 'New Logging',
            );
            expect(loggingLinks).toHaveLength(1);
            expect(loggingLinks[0].title).toBe('New Logging');
            expect(loggingLinks[0].url).toBe('https://new-logging.example.com/my-cluster');
        });

        test('dynamic cores link suppresses legacy cores link', () => {
            const dynamicLinks: MetaClusterLink[] = [
                {
                    type: 'cluster',
                    url: 'https://new-cores.example.com',
                    context: 'cores',
                    title: 'New Cores',
                },
            ];

            const result = resolveClusterLinks(
                makeClusterInfo({
                    links: dynamicLinks,
                    cores: {url: 'https://cores.example.com'},
                }),
            );

            const coresLinks = result.filter(
                (l) => l.title === 'Coredumps' || l.title === 'New Cores',
            );
            expect(coresLinks).toHaveLength(1);
            expect(coresLinks[0].title).toBe('New Cores');
        });

        test('dynamic slo-logs link suppresses legacy slo-logs link', () => {
            const dynamicLinks: MetaClusterLink[] = [
                {
                    type: 'cluster',
                    url: 'https://new-slo.example.com',
                    context: 'slo-logs',
                    title: 'New SLO',
                },
            ];

            const result = resolveClusterLinks(
                makeClusterInfo({
                    links: dynamicLinks,
                    logging: {slo_logs_url: 'https://slo.example.com'},
                }),
            );

            const sloLinks = result.filter((l) => l.title === 'SLO Logs' || l.title === 'New SLO');
            expect(sloLinks).toHaveLength(1);
            expect(sloLinks[0].title).toBe('New SLO');
        });

        test('uncovered contexts still get legacy links', () => {
            const dynamicLinks: MetaClusterLink[] = [
                {
                    type: 'cluster',
                    url: 'https://new-logging.example.com',
                    context: 'logging',
                    title: 'New Logging',
                },
            ];

            const result = resolveClusterLinks(
                makeClusterInfo({
                    links: dynamicLinks,
                    cores: {url: 'https://cores.example.com'},
                    logging: {
                        url: 'https://logging.example.com',
                        slo_logs_url: 'https://slo.example.com',
                    },
                }),
            );

            // logging is covered by dynamic, but cores and slo-logs should fall back to legacy
            expect(result).toHaveLength(3);
            expect(result.map((l) => l.title)).toEqual(['New Logging', 'Coredumps', 'SLO Logs']);
        });

        test('failed dynamic link does not suppress legacy link for same context', () => {
            const dynamicLinks: MetaClusterLink[] = [
                {
                    type: 'cluster',
                    url: 'https://example.com/{missing}',
                    context: 'logging',
                    title: 'Bad Link',
                },
            ];

            const result = resolveClusterLinks(
                makeClusterInfo({
                    links: dynamicLinks,
                    logging: {url: 'https://logging.example.com'},
                }),
            );

            // The dynamic link failed substitution, so legacy logging should still appear
            const loggingLinks = result.filter((l) => l.title === 'Logging');
            expect(loggingLinks).toHaveLength(1);
        });
    });

    describe('additional links', () => {
        test('includes additional links when no dynamic links exist', () => {
            const additionalLinks: ClusterLink[] = [
                {title: 'Monitoring', url: 'https://monitoring.example.com', context: 'monitoring'},
                {title: 'Custom Link', url: 'https://custom.example.com'},
            ];

            const result = resolveClusterLinks(makeClusterInfo(), additionalLinks);

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual(
                expect.objectContaining({
                    title: 'Monitoring',
                    url: 'https://monitoring.example.com',
                }),
            );
            expect(result[1]).toEqual(
                expect.objectContaining({
                    title: 'Custom Link',
                    url: 'https://custom.example.com',
                }),
            );
        });

        test('dynamic link suppresses additional link with same context', () => {
            const dynamicLinks: MetaClusterLink[] = [
                {
                    type: 'cluster',
                    url: 'https://new-monitoring.example.com',
                    context: 'monitoring',
                    title: 'New Monitoring',
                },
            ];

            const additionalLinks: ClusterLink[] = [
                {title: 'Monitoring', url: 'https://monitoring.example.com', context: 'monitoring'},
            ];

            const result = resolveClusterLinks(
                makeClusterInfo({links: dynamicLinks}),
                additionalLinks,
            );

            expect(result).toHaveLength(1);
            expect(result[0].title).toBe('New Monitoring');
        });

        test('additional links without context are always included', () => {
            const dynamicLinks: MetaClusterLink[] = [
                {
                    type: 'cluster',
                    url: 'https://example.com',
                    context: 'monitoring',
                    title: 'Monitoring',
                },
            ];

            const additionalLinks: ClusterLink[] = [
                {title: 'Custom Link', url: 'https://custom.example.com'},
            ];

            const result = resolveClusterLinks(
                makeClusterInfo({links: dynamicLinks}),
                additionalLinks,
            );

            expect(result).toHaveLength(2);
            expect(result[1].title).toBe('Custom Link');
        });

        test('additional link with context suppresses later additional link with same context', () => {
            const additionalLinks: ClusterLink[] = [
                {title: 'Custom Cores', url: 'https://custom-cores.example.com', context: 'cores'},
                {title: 'Coredumps', url: 'https://cores.example.com', context: 'cores'},
            ];

            const result = resolveClusterLinks(makeClusterInfo(), additionalLinks);

            const coresLinks = result.filter(
                (l) => l.title === 'Coredumps' || l.title === 'Custom Cores',
            );
            expect(coresLinks).toHaveLength(1);
            expect(coresLinks[0].title).toBe('Custom Cores');
        });

        test('additional links are placed after dynamic links', () => {
            const dynamicLinks: MetaClusterLink[] = [
                {
                    type: 'cluster',
                    url: 'https://dynamic.example.com',
                    context: 'logging',
                    title: 'Dynamic Logging',
                },
            ];

            const additionalLinks: ClusterLink[] = [
                {title: 'Coredumps', url: 'https://cores.example.com', context: 'cores'},
                {title: 'Extra Link', url: 'https://extra.example.com'},
            ];

            const result = resolveClusterLinks(
                makeClusterInfo({links: dynamicLinks}),
                additionalLinks,
            );

            expect(result.map((l) => l.title)).toEqual([
                'Dynamic Logging',
                'Coredumps',
                'Extra Link',
            ]);
        });

        test('additional link uses default title from context when title is empty', () => {
            const additionalLinks = [
                {title: '', url: 'https://cores.example.com', context: 'cores'},
            ] as ClusterLink[];

            const result = resolveClusterLinks(makeClusterInfo(), additionalLinks);

            expect(result).toHaveLength(1);
            expect(result[0].title).toBe('Coredumps');
        });

        test('additional link explicit title takes priority over context default', () => {
            const additionalLinks: ClusterLink[] = [
                {title: 'My Custom Cores', url: 'https://cores.example.com', context: 'cores'},
            ];

            const result = resolveClusterLinks(makeClusterInfo(), additionalLinks);

            expect(result).toHaveLength(1);
            expect(result[0].title).toBe('My Custom Cores');
        });

        test('additional link without title and without known context is skipped', () => {
            const additionalLinks = [
                {title: '', url: 'https://example.com', context: 'unknown'},
            ] as ClusterLink[];

            const result = resolveClusterLinks(makeClusterInfo(), additionalLinks);

            expect(result).toHaveLength(0);
        });

        test('additional link without title and without context is skipped', () => {
            const additionalLinks = [{title: '', url: 'https://example.com'}] as ClusterLink[];

            const result = resolveClusterLinks(makeClusterInfo(), additionalLinks);

            expect(result).toHaveLength(0);
        });
    });
});
