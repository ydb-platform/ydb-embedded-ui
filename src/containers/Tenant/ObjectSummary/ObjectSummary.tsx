import React from 'react';

import {
    ClipboardButton,
    DefinitionList,
    Flex,
    HelpMark,
    Tab,
    TabList,
    TabProvider,
} from '@gravity-ui/uikit';
import qs from 'qs';
import {useLocation} from 'react-router-dom';

import {AsyncReplicationState} from '../../../components/AsyncReplicationState';
import {toFormattedSize} from '../../../components/FormattedBytes/utils';
import {InternalLink} from '../../../components/InternalLink';
import {LinkWithIcon} from '../../../components/LinkWithIcon/LinkWithIcon';
import SplitPane from '../../../components/SplitPane';
import {createExternalUILink, getTenantPath} from '../../../routes';
import {overviewApi} from '../../../store/reducers/overview/overview';
import {TENANT_SUMMARY_TABS_IDS} from '../../../store/reducers/tenant/constants';
import {setSummaryTab} from '../../../store/reducers/tenant/tenant';
import {EPathSubType, EPathType} from '../../../types/api/schema';
import {
    DEFAULT_IS_TENANT_COMMON_INFO_COLLAPSED,
    DEFAULT_SIZE_TENANT_SUMMARY_KEY,
} from '../../../utils/constants';
import {
    formatDateTime,
    formatNumber,
    formatSecondsToHours,
} from '../../../utils/dataFormatters/dataFormatters';
import {useTypedDispatch, useTypedSelector} from '../../../utils/hooks';
import {useSetting} from '../../../utils/hooks/useSetting';
import {prepareSystemViewType} from '../../../utils/schema';
import {EntityTitle} from '../EntityTitle/EntityTitle';
import {SchemaViewer} from '../Schema/SchemaViewer/SchemaViewer';
import {useCurrentSchema} from '../TenantContext';
import {useTenantPage} from '../TenantNavigation/useTenantNavigation';
import {TENANT_INFO_TABS, TENANT_SCHEMA_TAB, TenantTabsGroups} from '../TenantPages';
import {useTenantQueryParams} from '../useTenantQueryParams';
import {getSummaryControls} from '../utils/controls';
import {
    PaneVisibilityActionTypes,
    PaneVisibilityToggleButtons,
    paneVisibilityToggleReducer,
} from '../utils/paneVisibilityToggleHelpers';
import {isTableType} from '../utils/schema';

import {ObjectTree} from './ObjectTree';
import {SchemaActions} from './SchemaActions';
import {RefreshTreeButton} from './SchemaTree/RefreshTreeButton';
import {TreeKeyProvider} from './UpdateTreeContext';
import i18n from './i18n';
import {b} from './shared';
import {isDomain, transformPath} from './transformPath';

import './ObjectSummary.scss';

interface ObjectSummaryProps {
    onCollapseSummary: VoidFunction;
    onExpandSummary: VoidFunction;
    isCollapsed: boolean;
}

export function ObjectSummary({
    onCollapseSummary,
    onExpandSummary,
    isCollapsed,
}: ObjectSummaryProps) {
    const {path, database, type, databaseFullPath} = useCurrentSchema();

    const dispatch = useTypedDispatch();
    const {handleSchemaChange} = useTenantQueryParams();
    const [isCommonInfoCollapsed, setIsCommonInfoCollapsed] = useSetting<boolean>(
        DEFAULT_IS_TENANT_COMMON_INFO_COLLAPSED,
        false,
    );
    const [commonInfoVisibilityState, dispatchCommonInfoVisibilityState] = React.useReducer(
        paneVisibilityToggleReducer,
        undefined,
        () => ({
            triggerExpand: false,
            triggerCollapse: false,
            collapsed: isCommonInfoCollapsed,
        }),
    );

    const {summaryTab = TENANT_SUMMARY_TABS_IDS.overview} = useTypedSelector(
        (state) => state.tenant,
    );

    const {handleTenantPageChange} = useTenantPage();

    const location = useLocation();

    const queryParams = qs.parse(location.search, {
        ignoreQueryPrefix: true,
    });

    const {currentData: currentObjectData} = overviewApi.useGetOverviewQuery({
        path,
        database,
        databaseFullPath,
    });
    const currentSchemaData = currentObjectData?.PathDescription?.Self;

    React.useEffect(() => {
        const isTable = isTableType(type);

        if (type && !isTable && !TENANT_INFO_TABS.find((el) => el.id === summaryTab)) {
            dispatch(setSummaryTab(TENANT_SUMMARY_TABS_IDS.overview));
        }
    }, [dispatch, type, summaryTab]);

    const renderTabs = () => {
        const isTable = isTableType(type);
        const tabsItems = isTable ? [...TENANT_INFO_TABS, ...TENANT_SCHEMA_TAB] : TENANT_INFO_TABS;

        return (
            <div className={b('tabs')}>
                <Flex
                    className={b('tabs-inner')}
                    justifyContent="space-between"
                    alignItems="center"
                >
                    <TabProvider value={summaryTab}>
                        <TabList size="l">
                            {tabsItems.map(({id, title}) => {
                                const tabPath = getTenantPath({
                                    ...queryParams,
                                    [TenantTabsGroups.summaryTab]: id,
                                });
                                return (
                                    <Tab key={id} value={id}>
                                        <InternalLink to={tabPath} as="tab">
                                            {title}
                                        </InternalLink>
                                    </Tab>
                                );
                            })}
                        </TabList>
                    </TabProvider>
                    {summaryTab === TENANT_SUMMARY_TABS_IDS.schema && <SchemaActions />}
                </Flex>
            </div>
        );
    };

    const renderObjectOverview = () => {
        if (!currentSchemaData) {
            return undefined;
        }
        const {CreateStep, PathType, PathSubType, PathId, PathVersion} = currentSchemaData;

        const overview = [];

        const normalizedType = isDomain(path, PathType)
            ? 'Domain'
            : PathType?.replace(/^EPathType/, '');

        overview.push({name: i18n('field_type'), content: normalizedType});

        if (PathSubType !== EPathSubType.EPathSubTypeEmpty) {
            overview.push({
                name: i18n('field_subtype'),
                content: PathSubType?.replace(/^EPathSubType/, ''),
            });
        }

        overview.push({name: i18n('field_id'), content: PathId});

        overview.push({name: i18n('field_version'), content: PathVersion});

        if (Number(CreateStep)) {
            overview.push({
                name: i18n('field_created'),
                content: formatDateTime(CreateStep),
            });
        }

        const {PathDescription} = currentObjectData;

        if (PathDescription?.TableStats) {
            const {DataSize, RowCount} = PathDescription.TableStats;

            overview.push(
                {
                    name: i18n('field_data-size'),
                    content: toFormattedSize(DataSize),
                },
                {
                    name: i18n('field_row-count'),
                    content: formatNumber(RowCount),
                },
            );
        }

        const getDatabaseOverview = () => {
            const {PathsInside, ShardsInside, PathsLimit, ShardsLimit} =
                PathDescription?.DomainDescription ?? {};
            let paths = formatNumber(PathsInside);
            let shards = formatNumber(ShardsInside);

            if (paths && PathsLimit) {
                paths = `${paths} / ${formatNumber(PathsLimit)}`;
            }

            if (shards && ShardsLimit) {
                shards = `${shards} / ${formatNumber(ShardsLimit)}`;
            }

            return [
                {
                    name: i18n('field_paths'),
                    content: paths,
                },
                {
                    name: i18n('field_shards'),
                    content: shards,
                },
            ];
        };

        const getPathTypeOverview: Record<
            EPathType,
            (() => {name: string; content?: React.ReactNode}[]) | undefined
        > = {
            [EPathType.EPathTypeInvalid]: undefined,
            [EPathType.EPathTypeDir]: undefined,
            [EPathType.EPathTypeResourcePool]: undefined,
            [EPathType.EPathTypeTable]: () => [
                {
                    name: i18n('field_partitions'),
                    content: PathDescription?.TablePartitions?.length,
                },
            ],
            [EPathType.EPathTypeSysView]: () => [
                {
                    name: i18n('field_system-view-type'),
                    content: prepareSystemViewType(PathDescription?.SysViewDescription?.Type),
                },
            ],
            [EPathType.EPathTypeSubDomain]: getDatabaseOverview,
            [EPathType.EPathTypeTableIndex]: undefined,
            [EPathType.EPathTypeExtSubDomain]: getDatabaseOverview,
            [EPathType.EPathTypeColumnStore]: () => [
                {
                    name: i18n('field_partitions'),
                    content: PathDescription?.ColumnStoreDescription?.ColumnShards?.length,
                },
            ],
            [EPathType.EPathTypeColumnTable]: () => [
                {
                    name: i18n('field_partitions'),
                    content:
                        PathDescription?.ColumnTableDescription?.Sharding?.ColumnShards?.length,
                },
            ],
            [EPathType.EPathTypeCdcStream]: () => {
                const {Mode, Format} = PathDescription?.CdcStreamDescription || {};

                return [
                    {
                        name: i18n('field_mode'),
                        content: Mode?.replace(/^ECdcStreamMode/, ''),
                    },
                    {
                        name: i18n('field_format'),
                        content: Format?.replace(/^ECdcStreamFormat/, ''),
                    },
                ];
            },
            [EPathType.EPathTypePersQueueGroup]: () => {
                const pqGroup = PathDescription?.PersQueueGroup;
                const value = pqGroup?.PQTabletConfig?.PartitionConfig?.LifetimeSeconds;

                return [
                    {
                        name: i18n('field_partitions'),
                        content: pqGroup?.Partitions?.length,
                    },
                    {
                        name: i18n('field_retention'),
                        content: value && formatSecondsToHours(value),
                    },
                ];
            },
            [EPathType.EPathTypeExternalTable]: () => {
                const pathToDataSource = createExternalUILink({
                    ...queryParams,
                    schema: PathDescription?.ExternalTableDescription?.DataSourcePath,
                });

                const {SourceType, DataSourcePath} =
                    PathDescription?.ExternalTableDescription || {};

                const dataSourceName = DataSourcePath?.match(/([^/]*)\/*$/)?.[1] || '';

                return [
                    {name: i18n('field_source-type'), content: SourceType},
                    {
                        name: i18n('field_data-source'),
                        content: DataSourcePath && (
                            <span title={DataSourcePath}>
                                <LinkWithIcon title={dataSourceName || ''} url={pathToDataSource} />
                            </span>
                        ),
                    },
                ];
            },
            [EPathType.EPathTypeExternalDataSource]: () => [
                {
                    name: i18n('field_source-type'),
                    content: PathDescription?.ExternalDataSourceDescription?.SourceType,
                },
            ],
            [EPathType.EPathTypeView]: undefined,
            [EPathType.EPathTypeReplication]: () => {
                const state = PathDescription?.ReplicationDescription?.State;

                if (!state) {
                    return [];
                }

                return [
                    {
                        name: i18n('field_state'),
                        content: <AsyncReplicationState state={state} />,
                    },
                ];
            },
            [EPathType.EPathTypeTransfer]: () => {
                const state = PathDescription?.ReplicationDescription?.State;

                if (!state) {
                    return [];
                }

                return [
                    {
                        name: i18n('field_state'),
                        content: <AsyncReplicationState state={state} />,
                    },
                ];
            },
            [EPathType.EPathTypeStreamingQuery]: undefined,
        };

        const pathTypeOverview = (PathType && getPathTypeOverview[PathType]?.()) || [];
        overview.push(...pathTypeOverview);

        // filter all empty values in according this requirement
        // https://github.com/ydb-platform/ydb-embedded-ui/issues/906
        const listItems = overview
            .filter((i) => i.content)
            .map((el) => ({
                ...el,
                content: <div className={b('overview-item-content')}>{el.content}</div>,
            }));
        return (
            <React.Fragment>
                <div className={b('overview-title')}>
                    <EntityTitle data={PathDescription} />
                </div>
                <DefinitionList responsive>
                    {listItems.map((item) => (
                        <DefinitionList.Item key={item.name} name={item.name}>
                            {item.content}
                        </DefinitionList.Item>
                    ))}
                </DefinitionList>
            </React.Fragment>
        );
    };

    const renderTabContent = () => {
        switch (summaryTab) {
            case TENANT_SUMMARY_TABS_IDS.schema: {
                return (
                    <SchemaViewer
                        type={type}
                        path={path}
                        database={database}
                        databaseFullPath={databaseFullPath}
                    />
                );
            }
            default: {
                return renderObjectOverview();
            }
        }
    };

    const onCollapseInfoHandler = () => {
        setIsCommonInfoCollapsed(true);
        dispatchCommonInfoVisibilityState(PaneVisibilityActionTypes.triggerCollapse);
    };
    const onExpandInfoHandler = () => {
        setIsCommonInfoCollapsed(false);
        dispatchCommonInfoVisibilityState(PaneVisibilityActionTypes.triggerExpand);
    };

    const onSplitStartDragAdditional = () => {
        setIsCommonInfoCollapsed(false);
        dispatchCommonInfoVisibilityState(PaneVisibilityActionTypes.clear);
    };

    const relativePath = transformPath(path, databaseFullPath);

    const renderCommonInfoControls = () => {
        const showPreview = isTableType(type);
        return (
            <React.Fragment>
                {showPreview &&
                    getSummaryControls(
                        dispatch,
                        {setActivePath: handleSchemaChange, setTenantPage: handleTenantPageChange},
                        'm',
                    )(path, 'preview')}
                <ClipboardButton
                    text={relativePath}
                    view="flat-secondary"
                    title={i18n('action_copySchemaPath')}
                />
                <PaneVisibilityToggleButtons
                    onCollapse={onCollapseInfoHandler}
                    onExpand={onExpandInfoHandler}
                    isCollapsed={commonInfoVisibilityState.collapsed}
                    initialDirection="bottom"
                />
            </React.Fragment>
        );
    };

    const renderEntityTypeBadge = () => {
        const {Status, Reason} = currentObjectData ?? {};
        if (type) {
            let label = type.replace('EPathType', '');
            if (isDomain(path, type)) {
                label = 'domain';
            }
            return <div className={b('entity-type')}>{label}</div>;
        }

        let message;
        if (Status && Reason) {
            message = `${Status}: ${Reason}`;
        }
        return (
            <div className={b('entity-type', {error: true})}>
                <HelpMark content={message} />
            </div>
        );
    };

    const renderContent = () => {
        return (
            <TreeKeyProvider>
                <div className={b()}>
                    <div className={b({hidden: isCollapsed})}>
                        <SplitPane
                            direction="vertical"
                            defaultSizePaneKey={DEFAULT_SIZE_TENANT_SUMMARY_KEY}
                            onSplitStartDragAdditional={onSplitStartDragAdditional}
                            triggerCollapse={commonInfoVisibilityState.triggerCollapse}
                            triggerExpand={commonInfoVisibilityState.triggerExpand}
                            minSize={[200, 52]}
                            collapsedSizes={[100, 0]}
                        >
                            <ObjectTree
                                database={database}
                                path={path}
                                databaseFullPath={databaseFullPath}
                            />
                            <div className={b('info')}>
                                <div className={b('sticky-top')}>
                                    <div className={b('info-header')}>
                                        <div className={b('info-title')}>
                                            {renderEntityTypeBadge()}
                                            <div className={b('path-name')}>{relativePath}</div>
                                        </div>
                                        <div className={b('info-controls')}>
                                            {renderCommonInfoControls()}
                                        </div>
                                    </div>
                                    {renderTabs()}
                                </div>
                                <div className={b('overview-wrapper')}>{renderTabContent()}</div>
                            </div>
                        </SplitPane>
                    </div>
                    <Flex className={b('actions')} gap={0.5}>
                        {!isCollapsed && <RefreshTreeButton />}
                        <PaneVisibilityToggleButtons
                            onCollapse={onCollapseSummary}
                            onExpand={onExpandSummary}
                            isCollapsed={isCollapsed}
                            initialDirection="left"
                        />
                    </Flex>
                </div>
            </TreeKeyProvider>
        );
    };

    return renderContent();
}
