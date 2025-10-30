import {Flex} from '@gravity-ui/uikit';
import {Link} from 'react-router-dom';

import type {InfoViewerItem} from '../../../../components/InfoViewer';
import {InfoViewer} from '../../../../components/InfoViewer';
import {LinkWithIcon} from '../../../../components/LinkWithIcon/LinkWithIcon';
import {TabletState} from '../../../../components/TabletState/TabletState';
import {TabletUptime} from '../../../../components/UptimeViewer/UptimeViewer';
import {getDefaultNodePath, useTabletPagePath} from '../../../../routes';
import {ETabletState} from '../../../../types/api/tablet';
import type {TTabletStateInfo} from '../../../../types/api/tablet';
import {cn} from '../../../../utils/cn';
import {createTabletDeveloperUIHref} from '../../../../utils/developerUI/developerUI';
import {useDatabaseFromQuery} from '../../../../utils/hooks/useDatabaseFromQuery';
import {useIsUserAllowedToMakeChanges} from '../../../../utils/hooks/useIsUserAllowedToMakeChanges';
import {hasHive} from '../../utils';

import {tabletInfoKeyset} from './i18n';

const b = cn('ydb-tablet-info');

import './TabletInfo.scss';

interface TabletInfoProps {
    tablet: TTabletStateInfo;
}

export const TabletInfo = ({tablet}: TabletInfoProps) => {
    const getTabletPagePath = useTabletPagePath();
    const isUserAllowedToMakeChanges = useIsUserAllowedToMakeChanges();
    const database = useDatabaseFromQuery();

    const {
        ChangeTime,
        Generation,
        FollowerId,
        NodeId,
        HiveId,
        State,
        TenantId: {SchemeShard} = {},
        TabletId,
    } = tablet;

    const hasHiveId = hasHive(HiveId);
    const hasUptime = State === ETabletState.Active;

    const tabletInfo: InfoViewerItem[] = [];

    if (hasHiveId) {
        tabletInfo.push({
            label: tabletInfoKeyset('field_hive'),
            value: (
                <Link to={getTabletPagePath(HiveId)} className={b('link')}>
                    {HiveId}
                </Link>
            ),
        });
    }

    if (SchemeShard) {
        tabletInfo.push({
            label: tabletInfoKeyset('field_scheme-shard'),
            value: (
                <Link to={getTabletPagePath(SchemeShard)} className={b('link')}>
                    {SchemeShard}
                </Link>
            ),
        });
    }

    tabletInfo.push({label: tabletInfoKeyset('field_state'), value: <TabletState state={State} />});

    if (hasUptime) {
        tabletInfo.push({
            label: tabletInfoKeyset('field_uptime'),
            value: <TabletUptime ChangeTime={ChangeTime} />,
        });
    }

    tabletInfo.push(
        {label: tabletInfoKeyset('field_generation'), value: Generation},
        {
            label: tabletInfoKeyset('field_node'),
            value: (
                <Link
                    className={b('link')}
                    to={getDefaultNodePath({id: String(NodeId)}, {database})}
                >
                    {NodeId}
                </Link>
            ),
        },
    );

    if (FollowerId) {
        tabletInfo.push({label: tabletInfoKeyset('field_follower'), value: FollowerId});
    }

    const renderTabletInfo = () => {
        return (
            <div>
                <div className={b('section-title')}>{tabletInfoKeyset('title_info')}</div>
                <InfoViewer info={tabletInfo} />
            </div>
        );
    };

    const renderLinks = () => {
        if (!isUserAllowedToMakeChanges || !TabletId) {
            return null;
        }
        return (
            <div>
                <div className={b('section-title')}>{tabletInfoKeyset('title_links')}</div>
                <Flex direction="column" gap={3}>
                    <LinkWithIcon
                        title={tabletInfoKeyset('field_developer-ui-app')}
                        url={createTabletDeveloperUIHref(TabletId, 'app')}
                    />
                    <LinkWithIcon
                        title={tabletInfoKeyset('field_developer-ui-counters')}
                        url={createTabletDeveloperUIHref(TabletId, 'counters')}
                    />
                    <LinkWithIcon
                        title={tabletInfoKeyset('field_developer-ui-executor')}
                        url={createTabletDeveloperUIHref(TabletId, 'executorInternals')}
                    />
                    <LinkWithIcon
                        title={tabletInfoKeyset('field_developer-ui-state')}
                        url={createTabletDeveloperUIHref(TabletId, undefined, 'SsId')}
                    />
                </Flex>
            </div>
        );
    };

    return (
        <Flex gap={10} wrap="nowrap">
            {renderTabletInfo()}
            {renderLinks()}
        </Flex>
    );
};
