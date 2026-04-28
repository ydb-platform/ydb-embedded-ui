import type {IconData} from '@gravity-ui/uikit';

import type {ClusterInfo} from '../../../store/reducers/cluster/cluster';
import type {ClusterLink} from '../../../types/additionalProps';
import type {MetaClusterLink} from '../../../types/api/meta';
import type {SubstitutionNamespaces} from '../resolveClusterLinks';
import {resolveClusterLinks, substituteUrlParams} from '../resolveClusterLinks';

/** Helper to build a minimal SubstitutionNamespaces for substituteUrlParams tests */
function makeNamespaces(obj: Record<string, Record<string, unknown>>): SubstitutionNamespaces {
    return obj as unknown as SubstitutionNamespaces;
}

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
        const namespaces = makeNamespaces({cluster: {name: 'my-cluster', env: 'prod'}});
        expect(substituteUrlParams('https://example.com/{name}/{env}', 'cluster', namespaces)).toBe(
            'https://example.com/my-cluster/prod',
        );
    });

    test('returns undefined when a placeholder has no matching param', () => {
        const namespaces = makeNamespaces({cluster: {name: 'my-cluster'}});
        expect(
            substituteUrlParams('https://example.com/{name}/{missing}', 'cluster', namespaces),
        ).toBeUndefined();
    });

    test('returns the URL as-is when there are no placeholders', () => {
        expect(
            substituteUrlParams(
                'https://example.com/static',
                'cluster',
                makeNamespaces({cluster: {name: 'my-cluster'}}),
            ),
        ).toBe('https://example.com/static');
    });

    test('returns the URL when all placeholders are resolved even with extra params', () => {
        const namespaces = makeNamespaces({cluster: {name: 'test', extra: 'unused'}});
        expect(substituteUrlParams('https://example.com/{name}', 'cluster', namespaces)).toBe(
            'https://example.com/test',
        );
    });

    test('handles empty namespaces with no placeholders', () => {
        expect(substituteUrlParams('https://example.com', 'cluster')).toBe('https://example.com');
    });

    test('returns undefined for empty namespaces with placeholders', () => {
        expect(substituteUrlParams('https://example.com/{id}', 'cluster')).toBeUndefined();
    });

    test('ignores non-string and non-number values in namespace', () => {
        const namespaces = {
            cluster: {name: 'test', count: 42, data: {nested: true}},
        } as Record<string, Record<string, unknown>>;
        expect(
            substituteUrlParams('https://example.com/{name}/{data}', 'cluster', namespaces),
        ).toBeUndefined();
    });

    test('uses string and number values for substitution', () => {
        const namespaces = {
            cluster: {name: 'test', scale: 1, settings: {use_meta_proxy: false}},
        } as Record<string, Record<string, unknown>>;
        expect(
            substituteUrlParams('https://example.com/{name}/{scale}', 'cluster', namespaces),
        ).toBe('https://example.com/test/1');
    });

    test('resolves {cluster.balancer} using namespaces map', () => {
        const namespaces = makeNamespaces({
            cluster: {balancer: 'https://balancer.example.com'},
        });
        expect(
            substituteUrlParams(
                'https://example.com/?balancer={cluster.balancer}',
                'other',
                namespaces,
            ),
        ).toBe('https://example.com/?balancer=https://balancer.example.com');
    });

    test('returns undefined for deeply nested dotted paths (only single-level prefix.field supported)', () => {
        const namespaces = makeNamespaces({cluster: {a: 'value'}});
        expect(
            substituteUrlParams('https://example.com/{cluster.a.b}', 'cluster', namespaces),
        ).toBeUndefined();
    });

    test('returns undefined for unknown dotted prefix not in namespaces', () => {
        const namespaces = makeNamespaces({cluster: {bar: 'value'}});
        expect(
            substituteUrlParams('https://example.com/{foo.bar}', 'cluster', namespaces),
        ).toBeUndefined();
    });

    test('returns undefined when dotted field is missing from namespace', () => {
        const namespaces = makeNamespaces({cluster: {name: 'my-cluster'}});
        expect(
            substituteUrlParams(
                'https://example.com/?balancer={cluster.balancer}',
                'cluster',
                namespaces,
            ),
        ).toBeUndefined();
    });

    test('returns undefined when dotted field resolves to non-string/non-number', () => {
        const namespaces = {cluster: {settings: {use_meta_proxy: false}}};
        expect(
            substituteUrlParams(
                'https://example.com/{cluster.settings}',
                'cluster',
                namespaces as Record<string, Record<string, unknown>>,
            ),
        ).toBeUndefined();
    });

    test('mixes flat and dotted placeholders in the same template', () => {
        const namespaces = makeNamespaces({
            cluster: {name: 'my-cluster', balancer: 'https://balancer.example.com'},
        });
        expect(
            substituteUrlParams(
                'https://example.com/{name}?balancer={cluster.balancer}',
                'cluster',
                namespaces,
            ),
        ).toBe('https://example.com/my-cluster?balancer=https://balancer.example.com');
    });

    test('returns undefined when flat placeholder resolves but dotted does not', () => {
        const namespaces = makeNamespaces({
            cluster: {name: 'my-cluster', balancer: 'value'},
        });
        expect(
            substituteUrlParams(
                'https://example.com/{name}?b={cluster.missing}',
                'cluster',
                namespaces,
            ),
        ).toBeUndefined();
    });

    test('resolves dotted placeholder with number value', () => {
        const namespaces = makeNamespaces({cluster: {scale: 42}});
        expect(
            substituteUrlParams('https://example.com/{cluster.scale}', 'other', namespaces),
        ).toBe('https://example.com/42');
    });

    test('dotted placeholder does not fall back to flat source', () => {
        const namespaces = makeNamespaces({flat: {balancer: 'val'}});
        expect(
            substituteUrlParams('https://example.com/{cluster.balancer}', 'flat', namespaces),
        ).toBeUndefined();
    });

    test('supports multiple namespace prefixes', () => {
        const namespaces = makeNamespaces({
            cluster: {balancer: 'balancer-val'},
            database: {name: 'db-name'},
        });
        expect(
            substituteUrlParams(
                'https://example.com/{cluster.balancer}/{database.name}',
                'other',
                namespaces,
            ),
        ).toBe('https://example.com/balancer-val/db-name');
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

        test('resolves {cluster.balancer} dotted placeholder from cluster info', () => {
            const dynamicLinks: MetaClusterLink[] = [
                {
                    type: 'cluster',
                    url: 'https://monitoring.com/?balancer={cluster.balancer}',
                    title: 'Monitoring',
                },
            ];

            const result = resolveClusterLinks(
                makeClusterInfo({links: dynamicLinks, balancer: 'https://balancer.example.com'}),
            );

            expect(result).toHaveLength(1);
            expect(result[0].url).toBe(
                'https://monitoring.com/?balancer=https://balancer.example.com',
            );
        });

        test('resolves {cluster.name} dotted placeholder from cluster info', () => {
            const dynamicLinks: MetaClusterLink[] = [
                {
                    type: 'cluster',
                    url: 'https://monitoring.com/{cluster.name}',
                    title: 'Monitoring',
                },
            ];

            const result = resolveClusterLinks(
                makeClusterInfo({links: dynamicLinks, name: 'my-cluster'}),
            );

            expect(result).toHaveLength(1);
            expect(result[0].url).toBe('https://monitoring.com/my-cluster');
        });

        test('skips links with unresolvable dotted path placeholders', () => {
            const dynamicLinks: MetaClusterLink[] = [
                {
                    type: 'cluster',
                    url: 'https://example.com/?val={cluster.nonexistent}',
                    title: 'Bad Link',
                    context: 'logging',
                },
            ];

            const result = resolveClusterLinks(makeClusterInfo({links: dynamicLinks}));
            expect(result).toHaveLength(0);
        });

        test('mixes flat and dotted placeholders in dynamic links', () => {
            const dynamicLinks: MetaClusterLink[] = [
                {
                    type: 'cluster',
                    url: 'https://monitoring.com/{name}?balancer={cluster.balancer}',
                    title: 'Monitoring',
                },
            ];

            const result = resolveClusterLinks(
                makeClusterInfo({
                    links: dynamicLinks,
                    name: 'my-cluster',
                    balancer: 'https://balancer.example.com',
                }),
            );

            expect(result).toHaveLength(1);
            expect(result[0].url).toBe(
                'https://monitoring.com/my-cluster?balancer=https://balancer.example.com',
            );
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

        test('additional link with custom icon preserves it even with known context', () => {
            const customIcon = (() => null) as unknown as IconData;
            const additionalLinks: ClusterLink[] = [
                {
                    title: 'Custom Cores',
                    url: 'https://cores.example.com',
                    context: 'cores',
                    icon: customIcon,
                },
            ];

            const result = resolveClusterLinks(makeClusterInfo(), additionalLinks);

            expect(result).toHaveLength(1);
            expect(result[0].icon).toBe(customIcon);
        });

        test('additional link without icon falls back to context icon', () => {
            const additionalLinks: ClusterLink[] = [
                {
                    title: 'Cores Link',
                    url: 'https://cores.example.com',
                    context: 'cores',
                },
            ];

            const result = resolveClusterLinks(makeClusterInfo(), additionalLinks);

            expect(result).toHaveLength(1);
            expect(result[0].icon).toBeDefined();
        });

        test('additional link with custom icon and unknown context keeps custom icon', () => {
            const customIcon = (() => null) as unknown as IconData;
            const additionalLinks: ClusterLink[] = [
                {
                    title: 'Custom Link',
                    url: 'https://example.com',
                    context: 'unknown-context',
                    icon: customIcon,
                },
            ];

            const result = resolveClusterLinks(makeClusterInfo(), additionalLinks);

            expect(result).toHaveLength(1);
            expect(result[0].icon).toBe(customIcon);
        });
    });
});
