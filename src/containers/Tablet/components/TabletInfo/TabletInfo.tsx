import {Flex, Link as UIKitLink} from '@gravity-ui/uikit';
import {Link} from 'react-router-dom';

import type {InfoViewerItem} from '../../../../components/InfoViewer';
import {InfoViewer} from '../../../../components/InfoViewer';
import {LinkWithIcon} from '../../../../components/LinkWithIcon/LinkWithIcon';
import {useTypedSelector} from '../../../../lib';
import {getTabletPagePath} from '../../../../routes';
import {selectIsUserAllowedToMakeChanges} from '../../../../store/reducers/authentication/authentication';
import {ETabletState} from '../../../../types/api/tablet';
import type {TTabletStateInfo} from '../../../../types/api/tablet';
import {calcUptime} from '../../../../utils/dataFormatters/dataFormatters';
import {createTabletDeveloperUIHref} from '../../../../utils/developerUI/developerUI';
import {getDefaultNodePath} from '../../../Node/NodePages';
import {b} from '../../shared';
import {hasHive} from '../../utils';

import {tabletInfoKeyset} from './i18n';

interface TabletInfoProps {
    tablet: TTabletStateInfo;
}

export const TabletInfo = ({tablet}: TabletInfoProps) => {
    const isUserAllowedToMakeChanges = useTypedSelector(selectIsUserAllowedToMakeChanges);

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
                <UIKitLink href={getTabletPagePath(HiveId)} target="_blank">
                    {HiveId}
                </UIKitLink>
            ),
        });
    }

    if (SchemeShard) {
        tabletInfo.push({
            label: tabletInfoKeyset('field_scheme-shard'),
            value: (
                <UIKitLink href={getTabletPagePath(SchemeShard)} target="_blank">
                    {SchemeShard}
                </UIKitLink>
            ),
        });
    }

    tabletInfo.push({label: tabletInfoKeyset('field_state'), value: State});

    if (hasUptime) {
        tabletInfo.push({label: tabletInfoKeyset('field_uptime'), value: calcUptime(ChangeTime)});
    }

    tabletInfo.push(
        {label: 'Generation', value: Generation},
        {
            label: tabletInfoKeyset('field_node'),
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

    const renderTabletInfo = () => {
        return <InfoViewer info={tabletInfo} />;
    };

    const renderLinks = () => {
        if (!isUserAllowedToMakeChanges || !TabletId) {
            return null;
        }
        return (
            <div>
                <div className={b('section-title')}>Links</div>
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
            <div>
                <div className={b('section-title')}>Info</div>
                {renderTabletInfo()}
            </div>
            {renderLinks()}
        </Flex>
    );
};
