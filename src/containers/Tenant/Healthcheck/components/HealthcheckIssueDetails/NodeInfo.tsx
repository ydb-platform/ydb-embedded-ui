import {InternalLink} from '../../../../../components/InternalLink';
import type {Location} from '../../../../../types/api/healthcheck';
import {getDefaultNodePath} from '../../../../Node/NodePages';
import {useTenantQueryParams} from '../../../useTenantQueryParams';
import i18n from '../../i18n';

import {LocationDetails} from './utils';

interface NodeInfoProps {
    node?: Location['node'];
    title?: string;
}

export function NodeInfo({node, title}: NodeInfoProps) {
    const {database} = useTenantQueryParams();
    if (!node) {
        return null;
    }

    const nodeLink = node.id ? (
        <InternalLink to={getDefaultNodePath(node.id, {database})}>{node.id}</InternalLink>
    ) : undefined;

    return (
        <LocationDetails
            title={title}
            fields={[
                {value: nodeLink, title: i18n('label_node-id')},
                {value: node.host, title: i18n('label_node-host'), copy: node.host},
                {value: node.port, title: i18n('label_node-port')},
            ]}
        />
    );
}
