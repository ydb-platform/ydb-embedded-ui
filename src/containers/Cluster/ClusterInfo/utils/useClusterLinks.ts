import React from 'react';

import {useClusterBaseInfo} from '../../../../store/reducers/cluster/cluster';
import type {ClusterLink} from '../../../../types/additionalProps';
import {parseJson} from '../../../../utils/utils';
import i18n from '../../i18n';

/**
 * parses stringified json in format {url: "href"}
 */
function prepareClusterCoresLink(rawCoresString?: string) {
    try {
        const linkObject = parseJson(rawCoresString) as unknown;

        if (
            linkObject &&
            typeof linkObject === 'object' &&
            'url' in linkObject &&
            typeof linkObject.url === 'string'
        ) {
            return linkObject.url;
        }
    } catch {}

    return undefined;
}

/**
 * parses stringified json in format {url: "href", slo_logs_url: "href"}
 */
function prepareClusterLoggingLinks(rawLoggingString?: string) {
    try {
        const linkObject = parseJson(rawLoggingString) as unknown;

        if (linkObject && typeof linkObject === 'object') {
            const logsUrl =
                'url' in linkObject && typeof linkObject.url === 'string'
                    ? linkObject.url
                    : undefined;
            const sloLogsUrl =
                'slo_logs_url' in linkObject && typeof linkObject.slo_logs_url === 'string'
                    ? linkObject.slo_logs_url
                    : undefined;
            return {logsUrl, sloLogsUrl};
        }
    } catch {}

    return {};
}

export function useClusterLinks() {
    const {cores, logging} = useClusterBaseInfo();

    return React.useMemo(() => {
        const result: ClusterLink[] = [];

        const coresUrl = prepareClusterCoresLink(cores);
        const {logsUrl, sloLogsUrl} = prepareClusterLoggingLinks(logging);

        if (coresUrl) {
            result.push({
                title: i18n('link_cores'),
                url: coresUrl,
            });
        }

        if (logsUrl) {
            result.push({
                title: i18n('link_logging'),
                url: logsUrl,
            });
        }

        if (sloLogsUrl) {
            result.push({
                title: i18n('link_slo-logs'),
                url: sloLogsUrl,
            });
        }

        return result;
    }, [cores, logging]);
}
