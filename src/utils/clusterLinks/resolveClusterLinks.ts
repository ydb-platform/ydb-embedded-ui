import type {ClusterInfo} from '../../store/reducers/cluster/cluster';
import type {ClusterLink, ClusterLinkWithTitle} from '../../types/additionalProps';
import type {MetaClusterLink} from '../../types/api/meta';
import {MONITORING_UI_TITLE} from '../constants';

import type {ClusterLinkContext} from './clusterLinkConstants';
import {CLUSTER_LINK_CONTEXT, getContextIcon} from './clusterLinkConstants';
import i18n from './i18n';

/** Default titles for known contexts, used when the link has no explicit title */
const CONTEXT_DEFAULT_TITLES: Record<ClusterLinkContext, string> = {
    [CLUSTER_LINK_CONTEXT.CORES]: i18n('title_cores-default'),
    [CLUSTER_LINK_CONTEXT.LOGGING]: i18n('title_logging-default'),
    [CLUSTER_LINK_CONTEXT.SLO_LOGS]: i18n('title_slo-logs-default'),
    [CLUSTER_LINK_CONTEXT.MONITORING]: MONITORING_UI_TITLE,
};

/** Default descriptions for known contexts, used when the link has no explicit description */
const CONTEXT_DEFAULT_DESCRIPTIONS: Partial<Record<ClusterLinkContext, string>> = {
    [CLUSTER_LINK_CONTEXT.CORES]: i18n('description_cores-default'),
    [CLUSTER_LINK_CONTEXT.LOGGING]: i18n('description_logging-default'),
    [CLUSTER_LINK_CONTEXT.MONITORING]: i18n('description_monitoring-default'),
};

/**
 * Map of namespace prefixes to their source objects for dotted placeholder resolution.
 * Currently supports `cluster`; extend this interface when new namespaces are needed
 * (e.g. `database`).
 */
export interface SubstitutionNamespaces {
    cluster?: ClusterInfo;
    /** Allow arbitrary namespace prefixes for forward-compatibility */
    [key: string]: Record<string, unknown> | undefined;
}

/** Matches `{param}` and `{prefix.param}` placeholders */
const PLACEHOLDER_PATTERN = /\{([\w.]+)\}/g;

/**
 * Resolves a placeholder key from the namespaces map.
 *
 * - Flat keys like `name` are resolved as `namespaces[source][name]`.
 * - Dotted keys like `cluster.balancer` are resolved as `namespaces[cluster][balancer]`.
 *   Only single-level dotted paths (`prefix.field`) are supported.
 *
 * Returns the resolved value if it is a string or number, otherwise `undefined`.
 */
function resolveParam(
    key: string,
    source: string,
    namespaces: SubstitutionNamespaces,
): string | number | undefined {
    let prefix: string;
    let field: string;

    if (key.includes('.')) {
        const parts = key.split('.');
        if (parts.length !== 2) {
            return undefined;
        }
        [prefix, field] = parts;
    } else {
        prefix = source;
        field = key;
    }

    const value = namespaces[prefix]?.[field];

    return typeof value === 'string' || typeof value === 'number' ? value : undefined;
}

/**
 * Replaces `{param}` and `{prefix.param}` placeholders in a URL template.
 *
 * - Flat placeholders like `{balancer}` are resolved via `namespaces[source][balancer]`.
 * - Dotted placeholders like `{cluster.balancer}` are resolved via `namespaces[cluster][balancer]`.
 *   Only single-level dotted paths are supported; unknown prefixes are unresolvable.
 *
 * Only string and number values are used for substitution.
 * Returns `undefined` if any placeholder remains unresolved after substitution.
 */
export function substituteUrlParams(
    template: string,
    source: string,
    namespaces: SubstitutionNamespaces = {},
): string | undefined {
    let hasUnresolved = false;

    const result = template.replace(PLACEHOLDER_PATTERN, (match, key: string) => {
        const value = resolveParam(key, source, namespaces);
        if (value === undefined) {
            hasUnresolved = true;
            return match;
        }
        return String(value);
    });

    return hasUnresolved ? undefined : result;
}

/**
 * Resolves the title for a link: explicit title > default title by context > undefined.
 */
function getLinkTitle(title?: string, context?: string) {
    if (title) {
        return title;
    }
    if (context) {
        return CONTEXT_DEFAULT_TITLES[context as ClusterLinkContext];
    }
    return undefined;
}

/**
 * Resolves the description for a link: explicit description > default description by context > undefined.
 */
function getLinkDescription(description?: string, context?: string) {
    if (description) {
        return description;
    }
    if (context) {
        return CONTEXT_DEFAULT_DESCRIPTIONS[context as ClusterLinkContext];
    }
    return undefined;
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
            if (link.type !== 'cluster') {
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
            const description = getLinkDescription(link.description, link.context);

            result.push({
                title,
                url: resolvedUrl,
                icon,
                description,
                context: link.context,
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
            const description = getLinkDescription(link.description, link.context);

            result.push({...link, title, icon, description});

            if (link.context) {
                coveredContexts.add(link.context);
            }
        }
    }

    return result;
}

/**
 * Builds the final list of cluster links by:
 * 1. Extracting URL substitution params from cluster info string fields
 * 2. Building legacy links from cores/logging fields in cluster info
 * 3. Processing dynamic links (type === 'cluster') with URL param substitution
 * 4. Adding additional links (legacy + user-provided) only for contexts NOT already covered
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

    return dynamicResult.concat(additionalResult);
}
