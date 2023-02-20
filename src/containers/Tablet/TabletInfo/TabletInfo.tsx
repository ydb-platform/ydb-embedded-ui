import {Link} from 'react-router-dom';

import {Link as UIKitLink} from '@gravity-ui/uikit';

import {ETabletState, TTabletStateInfo} from '../../../types/api/tablet';
import {InfoViewer, InfoViewerItem} from '../../../components/InfoViewer';
import routes, {createHref} from '../../../routes';
import {calcUptime} from '../../../utils';
import {getDefaultNodePath} from '../../Node/NodePages';

import {b} from '../Tablet';

interface TabletInfoProps {
    tablet: TTabletStateInfo;
    tenantPath: string;
}

export const TabletInfo = ({tablet, tenantPath}: TabletInfoProps) => {
    const {
        ChangeTime,
        Generation,
        FollowerId,
        NodeId,
        HiveId,
        State,
        Type,
        TenantId: {SchemeShard} = {},
    } = tablet;

    const hasHiveId = HiveId && HiveId !== '0';
    const hasUptime = State === ETabletState.Active;

    const tabletInfo: InfoViewerItem[] = [{label: 'Database', value: tenantPath}];

    if (hasHiveId) {
        tabletInfo.push({
            label: 'HiveId',
            value: (
                <UIKitLink href={createHref(routes.tablet, {id: HiveId})} target="_blank">
                    {HiveId}
                </UIKitLink>
            ),
        });
    }

    if (SchemeShard) {
        tabletInfo.push({
            label: 'SchemeShard',
            value: (
                <UIKitLink href={createHref(routes.tablet, {id: SchemeShard})} target="_blank">
                    {SchemeShard}
                </UIKitLink>
            ),
        });
    }

    tabletInfo.push({label: 'Type', value: Type}, {label: 'State', value: State});

    if (hasUptime) {
        tabletInfo.push({label: 'Uptime', value: calcUptime(ChangeTime)});
    }

    tabletInfo.push(
        {label: 'Generation', value: Generation},
        {
            label: 'Node',
            value: (
                <Link className={b('link')} to={getDefaultNodePath(String(NodeId))}>
                    {NodeId}
                </Link>
            ),
        },
    );

    if (FollowerId) {
        tabletInfo.push({label: 'Follower', value: FollowerId});
    }

    return <InfoViewer info={tabletInfo} />;
};
