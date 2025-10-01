import type {DefinitionListItemProps} from '@gravity-ui/uikit';
import {DefinitionList} from '@gravity-ui/uikit';

import type {PreparedStorageNode} from '../../../store/reducers/storage/types';
import {cn} from '../../../utils/cn';
import {useNodeDeveloperUIHref} from '../../../utils/hooks/useNodeDeveloperUIHref';
import {LinkWithIcon} from '../../LinkWithIcon/LinkWithIcon';

import i18n from './i18n';

import './NodeEndpointsTooltipContent.scss';

const b = cn('ydb-node-endpoints-tooltip-content');

interface NodeEdpointsTooltipProps {
    data?: PreparedStorageNode;
}

export const NodeEndpointsTooltipContent = ({data}: NodeEdpointsTooltipProps) => {
    const developerUIInternalHref = useNodeDeveloperUIHref(data);

    const info: (DefinitionListItemProps & {key: string})[] = [];

    if (data?.Roles?.length) {
        info.push({
            name: i18n('field_roles'),
            children: data.Roles.join(', '),
            key: 'Roles',
        });
    }

    if (data?.Tenants?.[0]) {
        info.push({
            name: i18n('field_database'),
            children: data.Tenants[0],
            key: 'Database',
        });
    }

    if (data?.Host) {
        info.push({
            name: i18n('field_host'),
            children: data.Host,
            copyText: data.Host,
            key: 'Host',
        });
    }

    if (data?.Rack) {
        info.push({name: i18n('field_rack'), children: data.Rack, key: 'Rack'});
    }

    if (data?.Endpoints && data.Endpoints.length) {
        data.Endpoints.forEach(({Name, Address}) => {
            if (Name && Address) {
                info.push({name: Name, children: Address, key: Name});
            }
        });
    }

    if (developerUIInternalHref) {
        info.push({
            name: 'Links',
            children: (
                <LinkWithIcon title={i18n('context_developer-ui')} url={developerUIInternalHref} />
            ),
            key: 'developerUi',
        });
    }

    return (
        <div className={b('list-container')}>
            <DefinitionList responsive>
                {info.map(({children, key, ...rest}) => {
                    return (
                        <DefinitionList.Item key={key} {...rest}>
                            <div className={b('definition')}>{children}</div>
                        </DefinitionList.Item>
                    );
                })}
            </DefinitionList>
        </div>
    );
};
