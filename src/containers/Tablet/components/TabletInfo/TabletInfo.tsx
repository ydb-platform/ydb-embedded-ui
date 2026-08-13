import {Flex} from '@gravity-ui/uikit';
import {Link} from 'react-router-dom';

import {LinkToSchemaObject} from '../../../../components/LinkToSchemaObject/LinkToSchemaObject';
import {LinkWithIcon} from '../../../../components/LinkWithIcon/LinkWithIcon';
import {TabletState} from '../../../../components/TabletState/TabletState';
import {TabletUptime} from '../../../../components/UptimeViewer/UptimeViewer';
import type {YDBDefinitionListItem} from '../../../../components/YDBDefinitionList/YDBDefinitionList';
import {YDBDefinitionList} from '../../../../components/YDBDefinitionList/YDBDefinitionList';
import {getDefaultNodePath, useTabletPagePath} from '../../../../routes';
import {ETabletState} from '../../../../types/api/tablet';
import type {TTabletStateInfo} from '../../../../types/api/tablet';
import {cn} from '../../../../utils/cn';
import {
    createTabletDeveloperUIHref,
    useHasDeveloperUi,
} from '../../../../utils/developerUI/developerUI';
import {useDatabaseFromQuery} from '../../../../utils/hooks/useDatabaseFromQuery';
import {transformPath} from '../../../Tenant/ObjectSummary/transformPath';
import {getTabletObjectKind, hasHive} from '../../utils';

import {tabletInfoKeyset} from './i18n';

const b = cn('ydb-tablet-info');

import './TabletInfo.scss';

interface TabletInfoProps {
    tablet: TTabletStateInfo;
    objectPath?: string;
    objectDatabase?: string;
}

export const TabletInfo = ({tablet, objectPath, objectDatabase}: TabletInfoProps) => {
    const getTabletPagePath = useTabletPagePath();
    const hasDeveloperUi = useHasDeveloperUi();
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
        Type,
    } = tablet;

    const hasHiveId = hasHive(HiveId);
    const hasUptime = State === ETabletState.Active;
    const objectKind = getTabletObjectKind(Type);

    const tabletInfo: YDBDefinitionListItem[] = [];

    if (objectPath && objectKind) {
        const objectDisplayPath = objectDatabase
            ? transformPath(objectPath, objectDatabase)
            : objectPath;

        tabletInfo.push({
            name: tabletInfoKeyset(objectKind === 'table' ? 'field_table' : 'field_topic'),
            content: (
                <LinkToSchemaObject
                    path={objectPath}
                    database={objectDatabase}
                    className={b('link')}
                >
                    {objectDisplayPath}
                </LinkToSchemaObject>
            ),
        });
    }

    if (hasHiveId) {
        tabletInfo.push({
            name: tabletInfoKeyset('field_hive'),
            content: (
                <Link to={getTabletPagePath(HiveId)} className={b('link')}>
                    {HiveId}
                </Link>
            ),
        });
    }

    if (SchemeShard) {
        tabletInfo.push({
            name: tabletInfoKeyset('field_scheme-shard'),
            content: (
                <Link to={getTabletPagePath(SchemeShard)} className={b('link')}>
                    {SchemeShard}
                </Link>
            ),
        });
    }

    tabletInfo.push({
        name: tabletInfoKeyset('field_state'),
        content: <TabletState state={State} />,
    });

    if (hasUptime) {
        tabletInfo.push({
            name: tabletInfoKeyset('field_uptime'),
            content: <TabletUptime ChangeTime={ChangeTime} />,
        });
    }

    tabletInfo.push(
        {name: tabletInfoKeyset('field_generation'), content: Generation},
        {
            name: tabletInfoKeyset('field_node'),
            content: (
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
        tabletInfo.push({name: tabletInfoKeyset('field_follower'), content: FollowerId});
    }

    const renderLinks = () => {
        if (!hasDeveloperUi || !TabletId) {
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
            <YDBDefinitionList
                title={tabletInfoKeyset('title_info')}
                items={tabletInfo}
                responsive
            />
            {renderLinks()}
        </Flex>
    );
};
