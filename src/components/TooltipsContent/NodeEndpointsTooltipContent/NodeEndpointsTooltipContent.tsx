import React from 'react';

import type {PreparedStorageNode} from '../../../store/reducers/storage/types';
import {useNodeDeveloperUIHref} from '../../../utils/hooks/useNodeDeveloperUIHref';
import {LinkWithIcon} from '../../LinkWithIcon/LinkWithIcon';
import type {YDBDefinitionListItem} from '../../YDBDefinitionList/YDBDefinitionList';
import {YDBDefinitionList} from '../../YDBDefinitionList/YDBDefinitionList';

import i18n from './i18n';

interface NodeEdpointsTooltipProps {
    data?: PreparedStorageNode;
}

const prepareNodeEndpointsData = (data?: PreparedStorageNode): YDBDefinitionListItem[] => {
    const info: YDBDefinitionListItem[] = [];

    if (data?.Roles?.length) {
        info.push({
            name: i18n('field_roles'),
            content: data.Roles.join(', '),
        });
    }
    const database = data?.Tenants?.[0];

    if (database) {
        info.push({
            name: i18n('field_database'),
            content: database,
            copyText: database,
        });
    }

    if (data?.Host) {
        info.push({
            name: i18n('field_host'),
            content: data.Host,
            copyText: data.Host,
        });
    }

    if (data?.Rack) {
        info.push({
            name: i18n('field_rack'),
            content: data.Rack,
        });
    }

    if (data?.Endpoints && data.Endpoints.length) {
        data.Endpoints.forEach(({Name, Address}) => {
            if (Name && Address) {
                info.push({name: Name, content: Address});
            }
        });
    }

    return info;
};

export const NodeEndpointsTooltipContent = ({data}: NodeEdpointsTooltipProps) => {
    const developerUIInternalHref = useNodeDeveloperUIHref(data);

    const info = React.useMemo(() => {
        const items = prepareNodeEndpointsData(data);

        if (developerUIInternalHref) {
            items.push({
                name: i18n('field_links'),
                content: (
                    <LinkWithIcon
                        title={i18n('context_developer-ui')}
                        url={developerUIInternalHref}
                    />
                ),
            });
        }

        return items;
    }, [data, developerUIInternalHref]);

    return <YDBDefinitionList items={info} compact responsive nameMaxWidth="auto" />;
};
