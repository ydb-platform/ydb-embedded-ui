import type {ClusterInfo} from '../../store/reducers/cluster/cluster';
import type {PreparedTenant} from '../../store/reducers/tenants/types';
import type {ClusterLink, ClusterLinkWithTitle, DatabaseLink} from '../../types/additionalProps';
import type {MetaClusterLink} from '../../types/api/meta';
import {MONITORING_UI_TITLE} from '../constants';

import type {ClusterLinkContext} from './clusterLinkConstants';
import {CLUSTER_LINK_CONTEXT, getContextIcon} from './clusterLinkConstants';
import i18n from './i18n';

const KnownLinkType = {
    cluster: 'cluster',
    database: 'database',
} as const;

const DESCRIPTION_I18N_KEYS = {
    cores: 'description_cores-default',
    logging: 'description_logging-default',
    monitoring: 'description_monitoring-default',
} as const satisfies Partial<Record<ClusterLinkContext, string>>;

type DescriptionI18nKey = (typeof DESCRIPTION_I18N_KEYS)[keyof typeof DESCRIPTION_I18N_KEYS];
type DescriptionI18nParams = {system: string};

/** Default titles for known contexts, used when the link has no explicit title */
const CONTEXT_DEFAULT_TITLES: Record<ClusterLinkContext, string> = {
    [CLUSTER_LINK_CONTEXT.CORES]: i18n('title_cores-default'),
    [CLUSTER_LINK_CONTEXT.LOGGING]: i18n('title_logging-default'),
    [CLUSTER_LINK_CONTEXT.SLO_LOGS]: i18n('title_slo-logs-default'),
    [CLUSTER_LINK_CONTEXT.AUDIT_LOGS]: i18n('title_audit-logs-default'),
    [CLUSTER_LINK_CONTEXT.MONITORING]: MONITORING_UI_TITLE,
};

const CONTEXT_PRIORITY: Record<ClusterLinkContext, number> = {
    [CLUSTER_LINK_CONTEXT.MONITORING]: 0,
    [CLUSTER_LINK_CONTEXT.LOGGING]: 1,
    [CLUSTER_LINK_CONTEXT.SLO_LOGS]: 2,
    [CLUSTER_LINK_CONTEXT.AUDIT_LOGS]: 3,
    [CLUSTER_LINK_CONTEXT.CORES]: 4,
};

function isClusterLinkContext(context: string | undefined): context is ClusterLinkContext {
    return context !== undefined && context in CONTEXT_DEFAULT_TITLES;
}

/** Default descriptions for known contexts, used when the link has no explicit description */
const CONTEXT_DEFAULT_DESCRIPTIONS_KEYS: Partial<Record<ClusterLinkContext, DescriptionI18nKey>> = {
    [CLUSTER_LINK_CONTEXT.CORES]: DESCRIPTION_I18N_KEYS.cores,
    [CLUSTER_LINK_CONTEXT.LOGGING]: DESCRIPTION_I18N_KEYS.logging,
    [CLUSTER_LINK_CONTEXT.MONITORING]: DESCRIPTION_I18N_KEYS.monitoring,
};

function getDefaultContext(
    context: ClusterLinkContext,
    params?: DescriptionI18nParams,
): string | undefined {
    const i18nKey = CONTEXT_DEFAULT_DESCRIPTIONS_KEYS[context];
    if (i18nKey) {
        return i18n(i18nKey, params);
    }

    return undefined;
}

/**
 * Map of namespace prefixes to their source objects for dotted placeholder resolution.
 * Supports `cluster` and `database` namespaces for URL placeholder substitution.
 */
export interface SubstitutionNamespaces {
    cluster?: ClusterInfo;
    database?: PreparedTenant;
}

/**
 * Converts a lowercase or kebab-case segment to PascalCase.
 *
 * Examples:
 * - `name`            → `Name`
 * - `user-attributes` → `UserAttributes`
 * - `id`              → `Id`
 * - `cloud_id`        → `cloud_id` (underscores are preserved as-is)
 *
 * Already-PascalCase segments pass through unchanged.
 */
function toPascalCase(segment: string): string {
    return segment.replace(/(^|-)([a-z])/g, (_match, _sep, letter: string) => letter.toUpperCase());
}

function isTraversableObject(value: unknown): value is Record<string, unknown> {
    return (
        value !== null && value !== undefined && typeof value === 'object' && !Array.isArray(value)
    );
}

/**
 * Matches raw `{param}` placeholders (allows hyphens for kebab-case keys).
 * URL-encoded braces are treated as URL literals, not placeholders.
 */
const PLACEHOLDER_PATTERN = /\{([\w.-]+)\}/g;

/**
 * Resolves a placeholder key from the namespaces map.
 *
 * - Flat keys like `name` are resolved as `namespaces[source][name]`.
 * - Dotted keys like `cluster.balancer` are resolved as `namespaces[cluster][balancer]`.
 * - Multi-level dotted keys like `cluster.settings.proxy` are resolved by
 *   traversing the nested object: `namespaces[cluster][settings][proxy]`.
 *
 * The first segment of a dotted key is always the namespace prefix.
 * Traversal stops and returns `undefined` if any intermediate value is not
 * a plain object (null, undefined, primitives, and arrays are not traversed).
 *
 * Each segment is first looked up as-is; if not found, it is normalised to
 * PascalCase and retried. This applies to all namespaces, so lowercase and
 * kebab-case placeholders resolve against PascalCase fields
 * (e.g. `{name}` → `Name`, `{user-attributes}` → `UserAttributes`).
 *
 * Returns the resolved value if it is a string or number, otherwise `undefined`.
 */
function resolveParam(
    key: string,
    source: string,
    namespaces: SubstitutionNamespaces,
): string | number | undefined {
    let prefix: string;
    let fields: string[];

    if (key.includes('.')) {
        const parts = key.split('.');
        [prefix, ...fields] = parts;
    } else {
        prefix = source;
        fields = [key];
    }

    const ns = (namespaces as Record<string, Record<string, unknown> | undefined>)[prefix];

    let value: unknown = ns;
    for (const segment of fields) {
        if (!isTraversableObject(value)) {
            return undefined;
        }
        const record = value;
        // Try the original segment first; if it doesn't match,
        // normalise it to PascalCase and retry so that lowercase /
        // kebab-case placeholders resolve against PascalCase fields.
        if (segment in record) {
            value = record[segment];
        } else {
            value = record[toPascalCase(segment)];
        }
    }

    return typeof value === 'string' || typeof value === 'number' ? value : undefined;
}

/**
 * Replaces raw `{param}` / `{prefix.field}` placeholders in a URL template.
 *
 * - Flat placeholders like `{balancer}` are resolved via `namespaces[source][balancer]`.
 * - Dotted placeholders like `{cluster.balancer}` are resolved via `namespaces[cluster][balancer]`.
 * - Multi-level dotted placeholders like `{cluster.settings.proxy}` are resolved by
 *   traversing nested objects: `namespaces[cluster][settings][proxy]`.
 *
 * The first segment of a dotted key is always the namespace prefix.
 * Traversal stops if any intermediate value is not a plain object
 * (null, undefined, primitives, and arrays are not traversed).
 * Lowercase and kebab-case segments are normalised to PascalCase as a fallback
 * (see {@link resolveParam} for details).
 * Only string and number leaf values are used for substitution.
 * Substituted values are treated as URL component values and are encoded with
 * `encodeURIComponent(value)`, except when the value is a complete URL
 * (starts with `http://` or `https://`) at the start of the template or after `/`.
 * This allows placeholders like `{balancer}` to be used as full URL bases in patterns
 * like `{balancer}/path`, while still encoding them in query strings like `?url={balancer}`.
 * Returns `undefined` if any placeholder remains unresolved after substitution.
 */
export function substituteUrlParams(
    template: string,
    source: string,
    namespaces: SubstitutionNamespaces = {},
): string | undefined {
    let hasUnresolved = false;

    const result = template.replace(
        PLACEHOLDER_PATTERN,
        (match, key: string | undefined, offset: number) => {
            if (!key) {
                hasUnresolved = true;
                return match;
            }

            const value = resolveParam(key, source, namespaces);
            if (value === undefined) {
                hasUnresolved = true;
                return match;
            }

            const stringValue = String(value);
            // Don't encode complete URLs when at start or after slash (URL base position)
            const isAtStart = offset === 0;
            const isAfterSlash = offset > 0 && template[offset - 1] === '/';
            const isCompleteUrl =
                stringValue.startsWith('http://') || stringValue.startsWith('https://');

            if (isCompleteUrl && (isAtStart || isAfterSlash)) {
                return stringValue;
            }

            return encodeURIComponent(stringValue);
        },
    );

    return hasUnresolved ? undefined : result;
}

/**
 * Resolves the title for a link: explicit title > default title by context > undefined.
 */
function getLinkTitle(title?: string, context?: string): string | undefined {
    if (title) {
        return title;
    }
    if (isClusterLinkContext(context)) {
        return CONTEXT_DEFAULT_TITLES[context];
    }
    return undefined;
}

/**
 * Resolves the description for a link: explicit description > default description by context > undefined.
 */
function getLinkDescription(
    description?: string,
    context?: string,
    params?: DescriptionI18nParams,
): string | undefined {
    if (description) {
        return description;
    }
    if (isClusterLinkContext(context)) {
        return getDefaultContext(context, params);
    }
    return undefined;
}

function getContextPriority(context: string | undefined): number {
    return isClusterLinkContext(context) ? CONTEXT_PRIORITY[context] : Infinity;
}

function sortByContextPriority(links: ClusterLinkWithTitle[]): ClusterLinkWithTitle[] {
    return links.toSorted((left, right) => {
        return getContextPriority(left.context) - getContextPriority(right.context);
    });
}

/** Builds legacy links from cores and logging fields in cluster info */
function buildLegacyLinks(clusterInfo: ClusterInfo): ClusterLink[] {
    const result: ClusterLink[] = [];
    const {cores, logging} = clusterInfo;

    if (cores?.url) {
        result.push({
            url: cores.url,
            context: CLUSTER_LINK_CONTEXT.CORES,
        });
    }

    if (logging?.url) {
        result.push({
            url: logging.url,
            context: CLUSTER_LINK_CONTEXT.LOGGING,
        });
    }

    if (logging?.slo_logs_url) {
        result.push({
            url: logging.slo_logs_url,
            context: CLUSTER_LINK_CONTEXT.SLO_LOGS,
        });
    }

    return result;
}

/**
 * Processes dynamic links with URL param substitution and collects covered contexts.
 * Only 'cluster' type links are processed.
 * Links without both title and context, or with unresolvable URLs, are dropped.
 */
function processDynamicLinks(
    dynamicLinks: MetaClusterLink[] | undefined,
    namespaces: SubstitutionNamespaces,
): {result: ClusterLinkWithTitle[]; coveredContexts: Set<string>} {
    const result: ClusterLinkWithTitle[] = [];
    const coveredContexts = new Set<string>();

    if (dynamicLinks) {
        for (const link of dynamicLinks) {
            if (link.type !== KnownLinkType.cluster) {
                continue;
            }

            const resolvedUrl = substituteUrlParams(link.url, link.type, namespaces);
            if (!resolvedUrl) {
                continue;
            }

            const title = getLinkTitle(link.title, link.context);
            if (!title) {
                continue;
            }

            const icon = getContextIcon(link.context);
            const description = getLinkDescription(link.description, link.context, {
                system: title,
            });

            result.push({
                title,
                url: resolvedUrl,
                icon,
                description,
                context: link.context,
                target: '_blank',
            } satisfies ClusterLinkWithTitle);

            if (link.context) {
                coveredContexts.add(link.context);
            }
        }
    }

    return {result, coveredContexts};
}

/**
 * Adds additional links for contexts not already covered.
 * Links without both title and context are dropped.
 */
function processAdditionalLinks(
    additionalLinks: ClusterLink[] | undefined,
    coveredContexts: Set<string>,
): ClusterLinkWithTitle[] {
    const result: ClusterLinkWithTitle[] = [];

    if (additionalLinks) {
        for (const link of additionalLinks) {
            if (link.context && coveredContexts.has(link.context)) {
                continue;
            }

            const title = getLinkTitle(link.title, link.context);
            if (!title) {
                continue;
            }

            const icon = link.icon ?? getContextIcon(link.context);
            const description = getLinkDescription(link.description, link.context, {
                system: title,
            });

            const target = link.target ?? '_blank';

            result.push({...link, title, icon, description, target});

            if (link.context) {
                coveredContexts.add(link.context);
            }
        }
    }

    return result;
}

/**
 * Builds the final list of cluster links by:
 * 1. Building legacy links from cores/logging fields in cluster info
 * 2. Processing dynamic links (type === 'cluster') with URL param substitution
 *    (cluster info is used as the `cluster` namespace for placeholder resolution)
 * 3. Adding additional links (legacy + user-provided) only for contexts NOT already covered
 *
 * Links without both title and context are dropped.
 * Links whose URL cannot be fully resolved are dropped.
 */
export function resolveClusterLinks(
    clusterInfo: ClusterInfo,
    additionalLinks: ClusterLink[] = [],
): ClusterLinkWithTitle[] {
    const legacyLinks = buildLegacyLinks(clusterInfo);
    const allAdditionalLinks = additionalLinks.concat(legacyLinks);

    const {result: dynamicResult, coveredContexts} = processDynamicLinks(clusterInfo.links, {
        cluster: clusterInfo,
    });

    const additionalResult = processAdditionalLinks(allAdditionalLinks, coveredContexts);
    const result = dynamicResult.concat(additionalResult);

    // Dynamic-only links should preserve their source order. Once additional or legacy links are
    // appended, normalize the merged list by known context priority; unknown/no-context links stay last.
    return additionalResult.length ? sortByContextPriority(result) : result;
}

/**
 * Processes dynamic links with type === 'database' and collects covered contexts.
 * Links without an explicit title and without a known-context default title, or with
 * unresolvable URLs, are dropped.
 */
function processDynamicDatabaseLinks(
    dynamicLinks: MetaClusterLink[] | undefined,
    namespaces: SubstitutionNamespaces,
): {result: ClusterLinkWithTitle[]; coveredContexts: Set<string>} {
    const result: ClusterLinkWithTitle[] = [];
    const coveredContexts = new Set<string>();
    if (dynamicLinks) {
        for (const link of dynamicLinks) {
            if (link.type !== KnownLinkType.database) {
                continue;
            }

            const resolvedUrl = substituteUrlParams(link.url, link.type, namespaces);
            if (!resolvedUrl) {
                continue;
            }

            const title = getLinkTitle(link.title, link.context);
            if (!title) {
                continue;
            }

            const icon = getContextIcon(link.context);
            const description = getLinkDescription(link.description, link.context, {
                system: title,
            });

            result.push({
                title,
                url: resolvedUrl,
                icon,
                description,
                context: link.context,
                target: '_blank',
            } satisfies ClusterLinkWithTitle);

            if (link.context) {
                coveredContexts.add(link.context);
            }
        }
    }

    return {result, coveredContexts};
}

/**
 * Adds additional database links for contexts not already covered by dynamic links.
 * Links whose context is already covered are suppressed.
 */
function processAdditionalDatabaseLinks(
    additionalLinks: DatabaseLink[] | undefined,
    coveredContexts: Set<string>,
): ClusterLinkWithTitle[] {
    const result: ClusterLinkWithTitle[] = [];

    if (additionalLinks) {
        for (const link of additionalLinks) {
            if (link.context && coveredContexts.has(link.context)) {
                continue;
            }

            const icon = link.icon ?? getContextIcon(link.context);
            const description = getLinkDescription(link.description, link.context, {
                system: link.title,
            });

            const target = link.target ?? '_blank';

            result.push({...link, icon, description, target});

            if (link.context) {
                coveredContexts.add(link.context);
            }
        }
    }

    return result;
}

/**
 * Builds the final list of database links by:
 * 1. Processing dynamic links (type === 'database') with URL param substitution
 * 2. Adding additional (legacy) links only for contexts NOT already covered
 *
 * Uses both database info and cluster info for URL placeholder substitution:
 * - Flat placeholders like `{name}` resolve from `databaseInfo` (the `database` namespace).
 * - Dotted placeholders like `{cluster.name}` resolve from `clusterInfo`.
 * - Dotted placeholders like `{database.name}` resolve from `databaseInfo`.
 *
 * Links without a title are dropped.
 * Links whose URL cannot be fully resolved are dropped.
 */
export function resolveDatabaseLinks(
    dynamicLinks: MetaClusterLink[] | undefined,
    databaseInfo: PreparedTenant,
    clusterInfo?: ClusterInfo,
    additionalLinks: DatabaseLink[] = [],
): ClusterLinkWithTitle[] {
    const namespaces: SubstitutionNamespaces = {
        database: databaseInfo,
        cluster: clusterInfo,
    };

    const {result: dynamicResult, coveredContexts} = processDynamicDatabaseLinks(
        dynamicLinks,
        namespaces,
    );

    const additionalResult = processAdditionalDatabaseLinks(additionalLinks, coveredContexts);
    const result = dynamicResult.concat(additionalResult);

    // Dynamic-only links should preserve their source order. Once additional links are appended,
    // normalize the merged list by known context priority; unknown/no-context links stay last.
    return additionalResult.length ? sortByContextPriority(result) : result;
}
