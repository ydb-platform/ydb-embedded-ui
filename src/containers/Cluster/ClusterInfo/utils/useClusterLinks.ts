import React from 'react';

import {useClusterBaseInfo} from '../../../../store/reducers/cluster/cluster';
import type {ClusterLink} from '../../../../types/additionalProps';
import i18n from '../../i18n';

export function useClusterLinks() {
    const {cores, logging} = useClusterBaseInfo();

    return React.useMemo(() => {
        const result: ClusterLink[] = [];

        if (cores?.url) {
            result.push({
                title: i18n('link_cores'),
                url: cores?.url,
            });
        }

        if (logging?.url) {
            result.push({
                title: i18n('link_logging'),
                url: logging?.url,
            });
        }

        if (logging?.slo_logs_url) {
            result.push({
                title: i18n('link_slo-logs'),
                url: logging.slo_logs_url,
            });
        }

        return result;
    }, [cores, logging]);
}
