import React from 'react';

import {Wrench} from '@gravity-ui/icons';

import type {PreparedStorageNode} from '../../../store/reducers/storage/types';
import {uiFactory} from '../../../uiFactory/uiFactory';
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
                info.push({name: Name, content: Address, copyText: Address});
            }
        });
    }

    return info;
};

export const NodeEndpointsTooltipContent = ({data}: NodeEdpointsTooltipProps) => {
    const developerUIInternalHref = useNodeDeveloperUIHref(data);

    const info = React.useMemo(() => prepareNodeEndpointsData(data), [data]);

    const nodeActions = uiFactory.renderNodeTooltipActions?.({data});

    const footer = React.useMemo(() => {
        if (!developerUIInternalHref && !nodeActions) {
            return undefined;
        }

        return (
            <React.Fragment>
                {developerUIInternalHref ? (
                    <LinkWithIcon
                        title={i18n('context_developer-ui')}
                        url={developerUIInternalHref}
                        icon={Wrench}
                        hideEndIcon
                    />
                ) : null}
                {nodeActions}
            </React.Fragment>
        );
    }, [developerUIInternalHref, nodeActions]);

    return (
        <YDBDefinitionList items={info} footer={footer} compact responsive nameMaxWidth="auto" />
    );
};
