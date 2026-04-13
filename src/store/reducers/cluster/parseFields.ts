import {z} from 'zod';

import type {
    MetaBaseClusterInfo,
    MetaClusterCoresUrl,
    MetaClusterLinks,
    MetaClusterLogsUrls,
    MetaClusterSettings,
    MetaClusterTraceView,
} from '../../../types/api/meta';

const traceViewSchema = z.object({
    url: z.string().url(),
});

export function parseTraceField(
    traceView: MetaBaseClusterInfo['trace_view'],
): MetaClusterTraceView | undefined {
    if (traceView && typeof traceView === 'object') {
        return traceView;
    }
    try {
        return traceView ? traceViewSchema.parse(JSON.parse(traceView)) : undefined;
    } catch (e) {
        console.error('Error parsing trace_view field:', e);
    }

    return undefined;
}

const coresUrlSchema = z.object({
    url: z.string().url(),
});

export function parseCoresUrl(
    cores: MetaBaseClusterInfo['cores'],
): MetaClusterCoresUrl | undefined {
    if (cores && typeof cores === 'object') {
        return cores;
    }
    try {
        return cores ? coresUrlSchema.parse(JSON.parse(cores)) : undefined;
    } catch (e) {
        console.error('Error parsing cores field:', e);
    }

    return undefined;
}

const loggingUrlsSchema = z.object({
    url: z.string().url().optional(),
    slo_logs_url: z.string().url().optional(),
    monium_cluster: z.string().optional(),
});

export function parseLoggingUrls(
    logging: MetaBaseClusterInfo['logging'],
): MetaClusterLogsUrls | undefined {
    if (logging && typeof logging === 'object') {
        return logging;
    }
    try {
        return logging ? loggingUrlsSchema.parse(JSON.parse(logging)) : undefined;
    } catch (e) {
        console.error('Error parsing logging field:', e);
    }

    return undefined;
}

const settingsSchema = z.object({
    use_meta_proxy: z.boolean().optional(),
    cluster_domain: z.string().optional(),
    cluster_external_name: z.string().optional(),
});

export function parseSettingsField(
    settings: MetaBaseClusterInfo['settings'],
): MetaClusterSettings | undefined {
    if (settings && typeof settings === 'object') {
        return settings;
    }
    try {
        return settings ? settingsSchema.parse(JSON.parse(settings)) : undefined;
    } catch (e) {
        console.error('Error parsing settings field:', e);
    }

    return undefined;
}

const linksSchema = z.array(
    z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        url: z.string(),
        type: z.string(),
        context: z.string().optional(),
    }),
);

export function parseLinksField(links: MetaBaseClusterInfo['links']): MetaClusterLinks | undefined {
    if (Array.isArray(links)) {
        return links;
    }
    try {
        return links ? linksSchema.parse(JSON.parse(links)) : undefined;
    } catch (e) {
        console.error('Error parsing links field:', e);
    }

    return undefined;
}
