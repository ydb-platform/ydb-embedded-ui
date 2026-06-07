import type {IconData} from '@gravity-ui/uikit';

import type {ClusterInfo} from '../../../store/reducers/cluster/cluster';
import type {PreparedTenant} from '../../../store/reducers/tenants/types';
import type {ClusterLink, DatabaseLink} from '../../../types/additionalProps';
import type {MetaClusterLink} from '../../../types/api/meta';
import type {SubstitutionNamespaces} from '../resolveClusterLinks';
import {
    resolveClusterLinks,
    resolveDatabaseLinks,
    substituteUrlParams,
} from '../resolveClusterLinks';

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

    test('resolves {cluster.balancer} as query param (encoded)', () => {
        const namespaces = makeNamespaces({
            cluster: {balancer: 'https://balancer.example.com'},
        });
        expect(
            substituteUrlParams(
                'https://example.com/?balancer={cluster.balancer}',
                'other',
                namespaces,
            ),
        ).toBe('https://example.com/?balancer=https%3A%2F%2Fbalancer.example.com');
    });

    test('resolves {balancer} as full URL without encoding at start (http)', () => {
        const namespaces = makeNamespaces({
            cluster: {balancer: 'http://meta.ydb.yandex.net:8765'},
        });
        expect(substituteUrlParams('{balancer}/monitoring/cluster', 'cluster', namespaces)).toBe(
            'http://meta.ydb.yandex.net:8765/monitoring/cluster',
        );
    });

    test('resolves {balancer} as full URL without encoding at start (https)', () => {
        const namespaces = makeNamespaces({
            cluster: {balancer: 'https://balancer.example.com'},
        });
        expect(substituteUrlParams('{balancer}/path', 'cluster', namespaces)).toBe(
            'https://balancer.example.com/path',
        );
    });

    test('resolves {cluster.balancer} as full URL without encoding at start', () => {
        const namespaces = makeNamespaces({
            cluster: {balancer: 'https://balancer.example.com'},
        });
        expect(substituteUrlParams('{cluster.balancer}/monitoring', 'other', namespaces)).toBe(
            'https://balancer.example.com/monitoring',
        );
    });

    test('encodes non-URL values normally', () => {
        const namespaces = makeNamespaces({
            cluster: {name: 'my cluster with spaces'},
        });
        expect(substituteUrlParams('https://example.com/{name}', 'cluster', namespaces)).toBe(
            'https://example.com/my%20cluster%20with%20spaces',
        );
    });

    test('resolves deeply nested dotted paths by traversing objects', () => {
        const namespaces = {
            cluster: {a: {b: 'deep-value'}},
        } as Record<string, Record<string, unknown>>;
        expect(
            substituteUrlParams('https://example.com/{cluster.a.b}', 'cluster', namespaces),
        ).toBe('https://example.com/deep-value');
    });

    test('resolves three-level nested dotted paths', () => {
        const namespaces = {
            cluster: {a: {b: {c: 'very-deep'}}},
        } as Record<string, Record<string, unknown>>;
        expect(
            substituteUrlParams('https://example.com/{cluster.a.b.c}', 'cluster', namespaces),
        ).toBe('https://example.com/very-deep');
    });

    test('returns undefined for deeply nested path when intermediate is not an object', () => {
        const namespaces = {
            cluster: {a: 'string-value'},
        } as Record<string, Record<string, unknown>>;
        expect(
            substituteUrlParams('https://example.com/{cluster.a.b}', 'cluster', namespaces),
        ).toBeUndefined();
    });

    test('returns undefined for deeply nested path when intermediate is missing', () => {
        const namespaces = makeNamespaces({cluster: {x: 'value'}});
        expect(
            substituteUrlParams('https://example.com/{cluster.a.b}', 'cluster', namespaces),
        ).toBeUndefined();
    });

    test('returns undefined for deeply nested path when intermediate is an array', () => {
        const namespaces = {
            cluster: {a: ['not', 'an', 'object']},
        } as Record<string, Record<string, unknown>>;
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
        ).toBe('https://example.com/my-cluster?balancer=https%3A%2F%2Fbalancer.example.com');
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

    test('replaces raw placeholders inside encoded query text with encoded values', () => {
        const namespaces = makeNamespaces({
            cluster: {name: 'prod cluster'},
            database: {name: '/Root/my db'},
        });

        expect(
            substituteUrlParams(
                'https://monitoring.example.com/projects/example/logs?query=%7Bproject+%3D+%22example%22%2C+cluster+%3D+%22{cluster.name}%22%2C+database+%3D+%22{database.name}%22%7D',
                'other',
                namespaces,
            ),
        ).toBe(
            'https://monitoring.example.com/projects/example/logs?query=%7Bproject+%3D+%22example%22%2C+cluster+%3D+%22prod%20cluster%22%2C+database+%3D+%22%2FRoot%2Fmy%20db%22%7D',
        );
    });

    test('returns undefined when a raw namespace placeholder is unresolved', () => {
        const namespaces = makeNamespaces({cluster: {name: 'my-cluster'}});

        expect(
            substituteUrlParams(
                'https://example.com/logs?query=%7Bcluster+%3D+%22{cluster.missing}%22%7D',
                'cluster',
                namespaces,
            ),
        ).toBeUndefined();
    });

    test('keeps URL-encoded brace literals as static URL text', () => {
        const namespaces = makeNamespaces({cluster: {name: 'my-cluster'}});

        expect(
            substituteUrlParams(
                'https://example.com/logs?query=message%3D~%22id-%5C%5Cd%7B4%7D%22+token%3D%22%7Bliteral_token%7D%22+encodedCluster%3D%22%7Bcluster.name%7D%22+cluster%3D%22{cluster.name}%22',
                'cluster',
                namespaces,
            ),
        ).toBe(
            'https://example.com/logs?query=message%3D~%22id-%5C%5Cd%7B4%7D%22+token%3D%22%7Bliteral_token%7D%22+encodedCluster%3D%22%7Bcluster.name%7D%22+cluster%3D%22my-cluster%22',
        );
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
                    title: 'Logging',
                    url: 'https://logging.example.com',
                }),
            );
            expect(result[1]).toEqual(
                expect.objectContaining({
                    title: 'SLO Logs',
                    url: 'https://slo.example.com',
                }),
            );
            expect(result[2]).toEqual(
                expect.objectContaining({
                    title: 'Coredumps',
                    url: 'https://cores.example.com',
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
                    target: '_blank',
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

        test('uses resolved default title in context default description', () => {
            const dynamicLinks: MetaClusterLink[] = [
                {type: 'cluster', url: 'https://monitoring.example.com', context: 'monitoring'},
            ];

            const result = resolveClusterLinks(makeClusterInfo({links: dynamicLinks}));

            expect(result).toHaveLength(1);
            expect(result[0].title).toBe('Monium');
            expect(result[0].description).toBe('Dashboards in Monium');
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

        test('uses fallback icon for unknown context', () => {
            const dynamicLinks: MetaClusterLink[] = [
                {type: 'cluster', url: 'https://example.com', context: 'unknown', title: 'Unknown'},
            ];

            const result = resolveClusterLinks(makeClusterInfo({links: dynamicLinks}));

            expect(result).toHaveLength(1);
            expect(result[0].icon).toBeDefined();
        });

        test('keeps dynamic-only links in source order', () => {
            const dynamicLinks: MetaClusterLink[] = [
                {
                    type: 'cluster',
                    url: 'https://cores.example.com',
                    context: 'cores',
                    title: 'Cores',
                },
                {
                    type: 'cluster',
                    url: 'https://monitoring.example.com',
                    context: 'monitoring',
                    title: 'Monitoring',
                },
                {
                    type: 'cluster',
                    url: 'https://logs.example.com',
                    context: 'logging',
                    title: 'Logs',
                },
            ];

            const result = resolveClusterLinks(makeClusterInfo({links: dynamicLinks}));

            expect(result.map((l) => l.title)).toEqual(['Cores', 'Monitoring', 'Logs']);
        });

        test('resolves {cluster.balancer} dotted placeholder from cluster info as query param (encoded)', () => {
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
                'https://monitoring.com/?balancer=https%3A%2F%2Fbalancer.example.com',
            );
        });

        test('resolves {balancer} as full URL without encoding at start', () => {
            const dynamicLinks: MetaClusterLink[] = [
                {
                    type: 'cluster',
                    url: '{balancer}/monitoring/cluster',
                    title: 'Monitoring',
                },
            ];

            const result = resolveClusterLinks(
                makeClusterInfo({links: dynamicLinks, balancer: 'http://meta.ydb.yandex.net:8765'}),
            );

            expect(result).toHaveLength(1);
            expect(result[0].url).toBe('http://meta.ydb.yandex.net:8765/monitoring/cluster');
        });

        test('resolves {cluster.balancer} as full URL without encoding at start', () => {
            const dynamicLinks: MetaClusterLink[] = [
                {
                    type: 'cluster',
                    url: '{cluster.balancer}/monitoring/cluster',
                    title: 'Monitoring',
                },
            ];

            const result = resolveClusterLinks(
                makeClusterInfo({links: dynamicLinks, balancer: 'https://balancer.example.com'}),
            );

            expect(result).toHaveLength(1);
            expect(result[0].url).toBe('https://balancer.example.com/monitoring/cluster');
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
                'https://monitoring.com/my-cluster?balancer=https%3A%2F%2Fbalancer.example.com',
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
            expect(result.map((l) => l.title)).toEqual(['New Logging', 'SLO Logs', 'Coredumps']);
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
                    target: '_blank',
                }),
            );
            expect(result[1]).toEqual(
                expect.objectContaining({
                    title: 'Custom Link',
                    url: 'https://custom.example.com',
                    target: '_blank',
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

        test('sorts final result by context priority when additional links are present', () => {
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
                {title: 'Monitoring', url: 'https://monitoring.example.com', context: 'monitoring'},
                {title: 'Extra Link', url: 'https://extra.example.com'},
            ];

            const result = resolveClusterLinks(
                makeClusterInfo({links: dynamicLinks}),
                additionalLinks,
            );

            expect(result.map((l) => l.title)).toEqual([
                'Monitoring',
                'Dynamic Logging',
                'Coredumps',
                'Extra Link',
            ]);
        });

        test('sorts known additional contexts by priority and preserves unknown-context order', () => {
            const additionalLinks: ClusterLink[] = [
                {title: 'Coredumps', url: 'https://cores.example.com', context: 'cores'},
                {title: 'Audit Logs', url: 'https://audit.example.com', context: 'audit-logs'},
                {title: 'Custom Link', url: 'https://custom.example.com'},
                {title: 'SLO Logs', url: 'https://slo.example.com', context: 'slo-logs'},
                {title: 'Logging', url: 'https://logs.example.com', context: 'logging'},
                {title: 'Monitoring', url: 'https://monitoring.example.com', context: 'monitoring'},
            ];

            const result = resolveClusterLinks(makeClusterInfo(), additionalLinks);

            expect(result.map((l) => l.title)).toEqual([
                'Monitoring',
                'Logging',
                'SLO Logs',
                'Audit Logs',
                'Coredumps',
                'Custom Link',
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

/** Helper to build a minimal database info object with TTenant-like field names */
function makeDatabaseInfo(overrides: Record<string, unknown> = {}): PreparedTenant {
    return {
        Name: '/Root/mydb',
        Type: 'Dedicated',
        Id: 'db-123',
        Cluster: 'my-cluster',
        ...overrides,
    } as PreparedTenant;
}

describe('resolveDatabaseLinks', () => {
    describe('basic processing', () => {
        test('returns empty array when dynamicLinks is undefined', () => {
            const result = resolveDatabaseLinks(undefined, makeDatabaseInfo());
            expect(result).toHaveLength(0);
        });

        test('returns empty array when dynamicLinks is empty', () => {
            const result = resolveDatabaseLinks([], makeDatabaseInfo());
            expect(result).toHaveLength(0);
        });

        test('processes database type links with successful URL substitution', () => {
            const dynamicLinks: MetaClusterLink[] = [
                {
                    type: 'database',
                    url: 'https://logs.example.com/{Name}',
                    title: 'DB Logs',
                },
            ];

            const result = resolveDatabaseLinks(dynamicLinks, makeDatabaseInfo());

            expect(result).toHaveLength(1);
            expect(result[0]).toEqual(
                expect.objectContaining({
                    title: 'DB Logs',
                    target: '_blank',
                    url: 'https://logs.example.com/%2FRoot%2Fmydb',
                }),
            );
        });

        test('skips links with non-database type', () => {
            const dynamicLinks: MetaClusterLink[] = [
                {type: 'cluster', url: 'https://cluster.example.com', title: 'Cluster Link'},
            ];

            const result = resolveDatabaseLinks(dynamicLinks, makeDatabaseInfo());
            expect(result).toHaveLength(0);
        });

        test('skips links with unresolvable URL placeholders', () => {
            const dynamicLinks: MetaClusterLink[] = [
                {
                    type: 'database',
                    url: 'https://example.com/{unknownParam}',
                    title: 'Bad Link',
                },
            ];

            const result = resolveDatabaseLinks(dynamicLinks, makeDatabaseInfo());
            expect(result).toHaveLength(0);
        });

        test('skips links without title and without known context', () => {
            const dynamicLinks: MetaClusterLink[] = [
                {type: 'database', url: 'https://example.com'},
            ];

            const result = resolveDatabaseLinks(dynamicLinks, makeDatabaseInfo());
            expect(result).toHaveLength(0);
        });
    });

    describe('placeholder resolution', () => {
        test('resolves flat placeholders from database info', () => {
            const dynamicLinks: MetaClusterLink[] = [
                {
                    type: 'database',
                    url: 'https://example.com/{Name}?type={Type}',
                    title: 'DB Link',
                },
            ];

            const result = resolveDatabaseLinks(dynamicLinks, makeDatabaseInfo());

            expect(result).toHaveLength(1);
            expect(result[0].url).toBe('https://example.com/%2FRoot%2Fmydb?type=Dedicated');
        });

        test('resolves {database.Name} dotted placeholder from database info', () => {
            const dynamicLinks: MetaClusterLink[] = [
                {
                    type: 'database',
                    url: 'https://example.com/{database.Name}',
                    title: 'DB Link',
                },
            ];

            const result = resolveDatabaseLinks(dynamicLinks, makeDatabaseInfo());

            expect(result).toHaveLength(1);
            expect(result[0].url).toBe('https://example.com/%2FRoot%2Fmydb');
        });

        test('resolves {cluster.name} dotted placeholder from cluster info', () => {
            const dynamicLinks: MetaClusterLink[] = [
                {
                    type: 'database',
                    url: 'https://example.com/{cluster.name}/{database.Name}',
                    title: 'DB Link',
                },
            ];

            const clusterInfo = makeClusterInfo({name: 'prod-cluster'});
            const result = resolveDatabaseLinks(dynamicLinks, makeDatabaseInfo(), clusterInfo);

            expect(result).toHaveLength(1);
            expect(result[0].url).toBe('https://example.com/prod-cluster/%2FRoot%2Fmydb');
        });

        test('resolves raw placeholders in Monitoring logs URL', () => {
            const dynamicLinks: MetaClusterLink[] = [
                {
                    type: 'database',
                    url: 'https://monitoring.example.com/projects/example/logs?query=%7Bproject+%3D+%22example%22%2C+service+%3D+%22database%22%2C+cluster+%3D+%22{cluster.name}%22%2C+database+%3D+%22{database.name}%22%2C+message+%3D~+%22sanitized_token%22%7D&from=now-1d&to=now&columns=level%2Ctime%2Cmessage%2Chost&groupByField=level&chartType=line&linesMode=single',
                    title: 'DB Logs',
                },
            ];

            const clusterInfo = makeClusterInfo({name: 'prod cluster'});
            const result = resolveDatabaseLinks(
                dynamicLinks,
                makeDatabaseInfo({Name: '/Root/my db'}),
                clusterInfo,
            );

            expect(result).toHaveLength(1);
            expect(result[0].url).toBe(
                'https://monitoring.example.com/projects/example/logs?query=%7Bproject+%3D+%22example%22%2C+service+%3D+%22database%22%2C+cluster+%3D+%22prod%20cluster%22%2C+database+%3D+%22%2FRoot%2Fmy%20db%22%2C+message+%3D~+%22sanitized_token%22%7D&from=now-1d&to=now&columns=level%2Ctime%2Cmessage%2Chost&groupByField=level&chartType=line&linesMode=single',
            );
        });

        test('resolves {cluster.balancer} from cluster info in database links', () => {
            const dynamicLinks: MetaClusterLink[] = [
                {
                    type: 'database',
                    url: 'https://monitoring.com/?balancer={cluster.balancer}&db={database.Name}',
                    title: 'Monitoring',
                },
            ];

            const clusterInfo = makeClusterInfo({balancer: 'https://balancer.example.com'});
            const result = resolveDatabaseLinks(dynamicLinks, makeDatabaseInfo(), clusterInfo);

            expect(result).toHaveLength(1);
            expect(result[0].url).toBe(
                'https://monitoring.com/?balancer=https%3A%2F%2Fbalancer.example.com&db=%2FRoot%2Fmydb',
            );
        });

        test('skips links with unresolvable cluster placeholders when no cluster info', () => {
            const dynamicLinks: MetaClusterLink[] = [
                {
                    type: 'database',
                    url: 'https://example.com/{cluster.balancer}',
                    title: 'Bad Link',
                },
            ];

            const result = resolveDatabaseLinks(dynamicLinks, makeDatabaseInfo());
            expect(result).toHaveLength(0);
        });

        test('resolves {database.Id} placeholder', () => {
            const dynamicLinks: MetaClusterLink[] = [
                {
                    type: 'database',
                    url: 'https://example.com/db/{database.Id}',
                    title: 'DB by ID',
                },
            ];

            const result = resolveDatabaseLinks(dynamicLinks, makeDatabaseInfo({Id: 'abc-123'}));

            expect(result).toHaveLength(1);
            expect(result[0].url).toBe('https://example.com/db/abc-123');
        });
    });

    describe('legacy lowercase alias resolution', () => {
        test('resolves {name} alias to PreparedTenant.Name', () => {
            const dynamicLinks: MetaClusterLink[] = [
                {
                    type: 'database',
                    url: 'https://logs.example.com/{name}',
                    title: 'DB Logs',
                },
            ];

            const result = resolveDatabaseLinks(dynamicLinks, makeDatabaseInfo());

            expect(result).toHaveLength(1);
            expect(result[0].url).toBe('https://logs.example.com/%2FRoot%2Fmydb');
        });

        test('resolves {id} alias to PreparedTenant.Id', () => {
            const dynamicLinks: MetaClusterLink[] = [
                {
                    type: 'database',
                    url: 'https://example.com/db/{id}',
                    title: 'DB by ID',
                },
            ];

            const result = resolveDatabaseLinks(dynamicLinks, makeDatabaseInfo({Id: 'abc-123'}));

            expect(result).toHaveLength(1);
            expect(result[0].url).toBe('https://example.com/db/abc-123');
        });

        test('resolves {type} alias to PreparedTenant.Type', () => {
            const dynamicLinks: MetaClusterLink[] = [
                {
                    type: 'database',
                    url: 'https://example.com/{type}',
                    title: 'DB by Type',
                },
            ];

            const result = resolveDatabaseLinks(dynamicLinks, makeDatabaseInfo());

            expect(result).toHaveLength(1);
            expect(result[0].url).toBe('https://example.com/Dedicated');
        });

        test('resolves {cluster} alias to PreparedTenant.Cluster', () => {
            const dynamicLinks: MetaClusterLink[] = [
                {
                    type: 'database',
                    url: 'https://example.com/{cluster}',
                    title: 'DB Cluster',
                },
            ];

            const result = resolveDatabaseLinks(dynamicLinks, makeDatabaseInfo());

            expect(result).toHaveLength(1);
            expect(result[0].url).toBe('https://example.com/my-cluster');
        });

        test('resolves mixed legacy and PascalCase placeholders', () => {
            const dynamicLinks: MetaClusterLink[] = [
                {
                    type: 'database',
                    url: 'https://example.com/{name}?id={Id}&type={type}',
                    title: 'Mixed Link',
                },
            ];

            const result = resolveDatabaseLinks(dynamicLinks, makeDatabaseInfo());

            expect(result).toHaveLength(1);
            expect(result[0].url).toBe(
                'https://example.com/%2FRoot%2Fmydb?id=db-123&type=Dedicated',
            );
        });

        test('resolves {database.name} dotted alias from database info', () => {
            const dynamicLinks: MetaClusterLink[] = [
                {
                    type: 'database',
                    url: 'https://example.com/{database.name}',
                    title: 'DB Link',
                },
            ];

            const result = resolveDatabaseLinks(dynamicLinks, makeDatabaseInfo());

            expect(result).toHaveLength(1);
            expect(result[0].url).toBe('https://example.com/%2FRoot%2Fmydb');
        });

        test('PascalCase field takes priority when tenant already has a lowercase field', () => {
            // If PreparedTenant somehow already has a 'name' field, alias should not overwrite it
            const dbInfo = makeDatabaseInfo({name: 'custom-lowercase-name'});
            const dynamicLinks: MetaClusterLink[] = [
                {
                    type: 'database',
                    url: 'https://example.com/{name}',
                    title: 'DB Link',
                },
            ];

            const result = resolveDatabaseLinks(dynamicLinks, dbInfo);

            expect(result).toHaveLength(1);
            expect(result[0].url).toBe('https://example.com/custom-lowercase-name');
        });

        test('legacy aliases combined with cluster dotted placeholders', () => {
            const dynamicLinks: MetaClusterLink[] = [
                {
                    type: 'database',
                    url: 'https://monitoring.com/{name}?balancer={cluster.balancer}',
                    title: 'Monitoring',
                },
            ];

            const clusterInfo = makeClusterInfo({balancer: 'https://balancer.example.com'});
            const result = resolveDatabaseLinks(dynamicLinks, makeDatabaseInfo(), clusterInfo);

            expect(result).toHaveLength(1);
            expect(result[0].url).toBe(
                'https://monitoring.com/%2FRoot%2Fmydb?balancer=https%3A%2F%2Fbalancer.example.com',
            );
        });

        test('resolves {database.user-attributes.cloud_id} via kebab-case alias', () => {
            const dynamicLinks: MetaClusterLink[] = [
                {
                    type: 'database',
                    url: 'https://example.com/{database.user-attributes.cloud_id}',
                    title: 'Cloud Link',
                },
            ];

            const dbInfo = makeDatabaseInfo({
                UserAttributes: {cloud_id: 'cloud-abc'},
            });
            const result = resolveDatabaseLinks(dynamicLinks, dbInfo);

            expect(result).toHaveLength(1);
            expect(result[0].url).toBe('https://example.com/cloud-abc');
        });

        test('resolves {database.UserAttributes.cloud_id} via PascalCase field', () => {
            const dynamicLinks: MetaClusterLink[] = [
                {
                    type: 'database',
                    url: 'https://example.com/{database.UserAttributes.cloud_id}',
                    title: 'Cloud Link',
                },
            ];

            const dbInfo = makeDatabaseInfo({
                UserAttributes: {cloud_id: 'cloud-abc'},
            });
            const result = resolveDatabaseLinks(dynamicLinks, dbInfo);

            expect(result).toHaveLength(1);
            expect(result[0].url).toBe('https://example.com/cloud-abc');
        });

        test('resolves flat {user-attributes} placeholder is not supported (nested object)', () => {
            // user-attributes is an object, not a string/number, so flat {user-attributes} should fail
            const dynamicLinks: MetaClusterLink[] = [
                {
                    type: 'database',
                    url: 'https://example.com/{user-attributes}',
                    title: 'Bad Link',
                },
            ];

            const dbInfo = makeDatabaseInfo({
                UserAttributes: {cloud_id: 'cloud-abc'},
            });
            const result = resolveDatabaseLinks(dynamicLinks, dbInfo);

            expect(result).toHaveLength(0);
        });

        test('resolves {database.user-attributes.folder_id} via kebab-case alias', () => {
            const dynamicLinks: MetaClusterLink[] = [
                {
                    type: 'database',
                    url: 'https://example.com/{database.user-attributes.folder_id}',
                    title: 'Folder Link',
                },
            ];

            const dbInfo = makeDatabaseInfo({
                UserAttributes: {folder_id: 'folder-xyz'},
            });
            const result = resolveDatabaseLinks(dynamicLinks, dbInfo);

            expect(result).toHaveLength(1);
            expect(result[0].url).toBe('https://example.com/folder-xyz');
        });
    });

    describe('title and context handling', () => {
        test('uses explicit title', () => {
            const dynamicLinks: MetaClusterLink[] = [
                {
                    type: 'database',
                    url: 'https://example.com',
                    title: 'Custom Title',
                },
            ];

            const result = resolveDatabaseLinks(dynamicLinks, makeDatabaseInfo());

            expect(result).toHaveLength(1);
            expect(result[0].title).toBe('Custom Title');
        });

        test('uses default title from known context when title is not provided', () => {
            const dynamicLinks: MetaClusterLink[] = [
                {type: 'database', url: 'https://example.com', context: 'logging'},
            ];

            const result = resolveDatabaseLinks(dynamicLinks, makeDatabaseInfo());

            expect(result).toHaveLength(1);
            expect(result[0].title).toBe('Logging');
        });

        test('uses resolved default title in context default description', () => {
            const dynamicLinks: MetaClusterLink[] = [
                {type: 'database', url: 'https://monitoring.example.com', context: 'monitoring'},
            ];

            const result = resolveDatabaseLinks(dynamicLinks, makeDatabaseInfo());

            expect(result).toHaveLength(1);
            expect(result[0].title).toBe('Monium');
            expect(result[0].description).toBe('Dashboards in Monium');
        });

        test('uses explicit title over context default title', () => {
            const dynamicLinks: MetaClusterLink[] = [
                {
                    type: 'database',
                    url: 'https://example.com',
                    context: 'logging',
                    title: 'Custom Logs',
                },
            ];

            const result = resolveDatabaseLinks(dynamicLinks, makeDatabaseInfo());

            expect(result).toHaveLength(1);
            expect(result[0].title).toBe('Custom Logs');
        });

        test('assigns icon based on context', () => {
            const dynamicLinks: MetaClusterLink[] = [
                {type: 'database', url: 'https://example.com', context: 'cores', title: 'Cores'},
            ];

            const result = resolveDatabaseLinks(dynamicLinks, makeDatabaseInfo());

            expect(result).toHaveLength(1);
            expect(result[0].icon).toBeDefined();
        });

        test('uses fallback icon for unknown context', () => {
            const dynamicLinks: MetaClusterLink[] = [
                {
                    type: 'database',
                    url: 'https://example.com',
                    context: 'unknown',
                    title: 'Unknown',
                },
            ];

            const result = resolveDatabaseLinks(dynamicLinks, makeDatabaseInfo());

            expect(result).toHaveLength(1);
            expect(result[0].icon).toBeDefined();
        });

        test('preserves description from link', () => {
            const dynamicLinks: MetaClusterLink[] = [
                {
                    type: 'database',
                    url: 'https://example.com',
                    title: 'DB Link',
                    description: 'Custom description',
                },
            ];

            const result = resolveDatabaseLinks(dynamicLinks, makeDatabaseInfo());

            expect(result).toHaveLength(1);
            expect(result[0].description).toBe('Custom description');
        });
    });

    describe('mixed link types', () => {
        test('only processes database type links, ignores cluster type', () => {
            const dynamicLinks: MetaClusterLink[] = [
                {type: 'database', url: 'https://db.example.com', title: 'DB Link'},
                {type: 'cluster', url: 'https://cluster.example.com', title: 'Cluster Link'},
                {type: 'database', url: 'https://db2.example.com', title: 'DB Link 2'},
            ];

            const result = resolveDatabaseLinks(dynamicLinks, makeDatabaseInfo());

            expect(result).toHaveLength(2);
            expect(result[0].title).toBe('DB Link');
            expect(result[1].title).toBe('DB Link 2');
        });

        test('processes multiple database links preserving order', () => {
            const dynamicLinks: MetaClusterLink[] = [
                {type: 'database', url: 'https://first.example.com', title: 'First'},
                {type: 'database', url: 'https://second.example.com', title: 'Second'},
                {type: 'database', url: 'https://third.example.com', title: 'Third'},
            ];

            const result = resolveDatabaseLinks(dynamicLinks, makeDatabaseInfo());

            expect(result).toHaveLength(3);
            expect(result.map((l) => l.title)).toEqual(['First', 'Second', 'Third']);
        });

        test('keeps dynamic-only database links in source order', () => {
            const dynamicLinks: MetaClusterLink[] = [
                {
                    type: 'database',
                    url: 'https://cores.example.com',
                    context: 'cores',
                    title: 'Cores',
                },
                {
                    type: 'database',
                    url: 'https://monitoring.example.com',
                    context: 'monitoring',
                    title: 'Monitoring',
                },
                {
                    type: 'database',
                    url: 'https://logs.example.com',
                    context: 'logging',
                    title: 'Logs',
                },
            ];

            const result = resolveDatabaseLinks(dynamicLinks, makeDatabaseInfo());

            expect(result.map((l) => l.title)).toEqual(['Cores', 'Monitoring', 'Logs']);
        });
    });

    describe('context-based deduplication with additional links', () => {
        const mockIcon = (() => null) as unknown as IconData;

        test('includes additional links when no dynamic links exist', () => {
            const additionalLinks: DatabaseLink[] = [
                {
                    title: 'Monitoring',
                    url: 'https://monitoring.example.com',
                    icon: mockIcon,
                    context: 'monitoring',
                },
                {
                    title: 'Logs',
                    url: 'https://logs.example.com',
                    icon: mockIcon,
                    context: 'logging',
                },
            ];

            const result = resolveDatabaseLinks(
                undefined,
                makeDatabaseInfo(),
                undefined,
                additionalLinks,
            );

            expect(result).toHaveLength(2);
            expect(result[0].title).toBe('Monitoring');
            expect(result[1].title).toBe('Logs');
            expect(result[0].target).toBe('_blank');
            expect(result[1].target).toBe('_blank');
        });

        test('dynamic logging link suppresses additional logging link', () => {
            const dynamicLinks: MetaClusterLink[] = [
                {
                    type: 'database',
                    url: 'https://new-logs.example.com/{Name}',
                    context: 'logging',
                    title: 'New Logs',
                },
            ];

            const additionalLinks: DatabaseLink[] = [
                {
                    title: 'Logs',
                    url: 'https://logs.example.com',
                    icon: mockIcon,
                    context: 'logging',
                },
            ];

            const result = resolveDatabaseLinks(
                dynamicLinks,
                makeDatabaseInfo(),
                undefined,
                additionalLinks,
            );

            const loggingLinks = result.filter((l) => l.context === 'logging');
            expect(loggingLinks).toHaveLength(1);
            expect(loggingLinks[0].title).toBe('New Logs');
        });

        test('dynamic monitoring link suppresses additional monitoring link', () => {
            const dynamicLinks: MetaClusterLink[] = [
                {
                    type: 'database',
                    url: 'https://new-monitoring.example.com',
                    context: 'monitoring',
                    title: 'New Monitoring',
                },
            ];

            const additionalLinks: DatabaseLink[] = [
                {
                    title: 'Monitoring',
                    url: 'https://monitoring.example.com',
                    icon: mockIcon,
                    context: 'monitoring',
                },
            ];

            const result = resolveDatabaseLinks(
                dynamicLinks,
                makeDatabaseInfo(),
                undefined,
                additionalLinks,
            );

            const monitoringLinks = result.filter((l) => l.context === 'monitoring');
            expect(monitoringLinks).toHaveLength(1);
            expect(monitoringLinks[0].title).toBe('New Monitoring');
        });

        test('uncovered contexts still get additional links', () => {
            const dynamicLinks: MetaClusterLink[] = [
                {
                    type: 'database',
                    url: 'https://new-logs.example.com',
                    context: 'logging',
                    title: 'New Logs',
                },
            ];

            const additionalLinks: DatabaseLink[] = [
                {
                    title: 'Monitoring',
                    url: 'https://monitoring.example.com',
                    icon: mockIcon,
                    context: 'monitoring',
                },
                {
                    title: 'Logs',
                    url: 'https://logs.example.com',
                    icon: mockIcon,
                    context: 'logging',
                },
            ];

            const result = resolveDatabaseLinks(
                dynamicLinks,
                makeDatabaseInfo(),
                undefined,
                additionalLinks,
            );

            expect(result).toHaveLength(2);
            expect(result.map((l) => l.title)).toEqual(['Monitoring', 'New Logs']);
        });

        test('failed dynamic link does not suppress additional link for same context', () => {
            const dynamicLinks: MetaClusterLink[] = [
                {
                    type: 'database',
                    url: 'https://example.com/{missingField}',
                    context: 'logging',
                    title: 'Bad Link',
                },
            ];

            const additionalLinks: DatabaseLink[] = [
                {
                    title: 'Logs',
                    url: 'https://logs.example.com',
                    icon: mockIcon,
                    context: 'logging',
                },
            ];

            const result = resolveDatabaseLinks(
                dynamicLinks,
                makeDatabaseInfo(),
                undefined,
                additionalLinks,
            );

            const loggingLinks = result.filter((l) => l.context === 'logging');
            expect(loggingLinks).toHaveLength(1);
            expect(loggingLinks[0].title).toBe('Logs');
        });

        test('additional links without context are always included', () => {
            const dynamicLinks: MetaClusterLink[] = [
                {
                    type: 'database',
                    url: 'https://example.com',
                    context: 'logging',
                    title: 'Dynamic Logs',
                },
            ];

            const additionalLinks: DatabaseLink[] = [
                {title: 'Custom Link', url: 'https://custom.example.com', icon: mockIcon},
            ];

            const result = resolveDatabaseLinks(
                dynamicLinks,
                makeDatabaseInfo(),
                undefined,
                additionalLinks,
            );

            expect(result).toHaveLength(2);
            expect(result[1].title).toBe('Custom Link');
        });

        test('sorts final result by context priority when additional links are present', () => {
            const dynamicLinks: MetaClusterLink[] = [
                {
                    type: 'database',
                    url: 'https://dynamic.example.com',
                    context: 'logging',
                    title: 'Dynamic Logging',
                },
            ];

            const additionalLinks: DatabaseLink[] = [
                {
                    title: 'Monitoring',
                    url: 'https://monitoring.example.com',
                    icon: mockIcon,
                    context: 'monitoring',
                },
                {title: 'Extra Link', url: 'https://extra.example.com', icon: mockIcon},
            ];

            const result = resolveDatabaseLinks(
                dynamicLinks,
                makeDatabaseInfo(),
                undefined,
                additionalLinks,
            );

            expect(result.map((l) => l.title)).toEqual([
                'Monitoring',
                'Dynamic Logging',
                'Extra Link',
            ]);
        });

        test('sorts known additional contexts by priority and preserves unknown-context order', () => {
            const additionalLinks: DatabaseLink[] = [
                {
                    title: 'Coredumps',
                    url: 'https://cores.example.com',
                    icon: mockIcon,
                    context: 'cores',
                },
                {
                    title: 'Audit Logs',
                    url: 'https://audit.example.com',
                    icon: mockIcon,
                    context: 'audit-logs',
                },
                {title: 'Custom Link', url: 'https://custom.example.com', icon: mockIcon},
                {
                    title: 'SLO Logs',
                    url: 'https://slo.example.com',
                    icon: mockIcon,
                    context: 'slo-logs',
                },
                {
                    title: 'Logging',
                    url: 'https://logs.example.com',
                    icon: mockIcon,
                    context: 'logging',
                },
                {
                    title: 'Monitoring',
                    url: 'https://monitoring.example.com',
                    icon: mockIcon,
                    context: 'monitoring',
                },
            ];

            const result = resolveDatabaseLinks(
                undefined,
                makeDatabaseInfo(),
                undefined,
                additionalLinks,
            );

            expect(result.map((l) => l.title)).toEqual([
                'Monitoring',
                'Logging',
                'SLO Logs',
                'Audit Logs',
                'Coredumps',
                'Custom Link',
            ]);
        });

        test('additional link preserves explicit description', () => {
            const additionalLinks: DatabaseLink[] = [
                {
                    title: 'Monitoring',
                    url: 'https://monitoring.example.com',
                    icon: mockIcon,
                    context: 'monitoring',
                    description: 'Custom monitoring description',
                },
            ];

            const result = resolveDatabaseLinks(
                undefined,
                makeDatabaseInfo(),
                undefined,
                additionalLinks,
            );

            expect(result).toHaveLength(1);
            expect(result[0].description).toBe('Custom monitoring description');
        });

        test('additional link without description falls back to context default description', () => {
            const additionalLinks: DatabaseLink[] = [
                {
                    title: 'Logs',
                    url: 'https://logs.example.com',
                    icon: mockIcon,
                    context: 'logging',
                },
            ];

            const result = resolveDatabaseLinks(
                undefined,
                makeDatabaseInfo(),
                undefined,
                additionalLinks,
            );

            expect(result).toHaveLength(1);
            expect(result[0].description).toBeDefined();
            expect(result[0].description).not.toBe('');
        });

        test('additional link without icon falls back to context icon', () => {
            const additionalLinks: DatabaseLink[] = [
                {
                    title: 'Monitoring',
                    url: 'https://monitoring.example.com',
                    context: 'monitoring',
                },
            ];

            const result = resolveDatabaseLinks(
                undefined,
                makeDatabaseInfo(),
                undefined,
                additionalLinks,
            );

            expect(result).toHaveLength(1);
            expect(result[0].icon).toBeDefined();
        });

        test('additional link with custom icon preserves it even with known context', () => {
            const additionalLinks: DatabaseLink[] = [
                {
                    title: 'Monitoring',
                    url: 'https://monitoring.example.com',
                    icon: mockIcon,
                    context: 'monitoring',
                },
            ];

            const result = resolveDatabaseLinks(
                undefined,
                makeDatabaseInfo(),
                undefined,
                additionalLinks,
            );

            expect(result).toHaveLength(1);
            expect(result[0].icon).toBe(mockIcon);
        });
    });
});
