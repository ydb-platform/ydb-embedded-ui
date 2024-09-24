import React from 'react';

import {HelpPopover} from '@gravity-ui/components';
import {Flex, Tabs} from '@gravity-ui/uikit';
import qs from 'qs';
import {Link, useLocation} from 'react-router-dom';
import {StringParam, useQueryParam} from 'use-query-params';

import {AsyncReplicationState} from '../../../components/AsyncReplicationState';
import {ClipboardButton} from '../../../components/ClipboardButton';
import {toFormattedSize} from '../../../components/FormattedBytes/utils';
import {InfoViewer} from '../../../components/InfoViewer/InfoViewer';
import type {InfoViewerItem} from '../../../components/InfoViewer/InfoViewer';
import {LinkWithIcon} from '../../../components/LinkWithIcon/LinkWithIcon';
import SplitPane from '../../../components/SplitPane';
import routes, {createExternalUILink, createHref} from '../../../routes';
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
import {useAutoRefreshInterval, useTypedDispatch, useTypedSelector} from '../../../utils/hooks';
import {Acl} from '../Acl/Acl';
import {EntityTitle} from '../EntityTitle/EntityTitle';
import {SchemaViewer} from '../Schema/SchemaViewer/SchemaViewer';
import {TENANT_INFO_TABS, TENANT_SCHEMA_TAB, TenantTabsGroups} from '../TenantPages';
import {getSummaryControls} from '../utils/controls';
import {
    PaneVisibilityActionTypes,
    PaneVisibilityToggleButtons,
    paneVisibilityToggleReducerCreator,
} from '../utils/paneVisibilityToggleHelpers';
import {isIndexTableType, isTableType} from '../utils/schema';

import {ObjectTree} from './ObjectTree';
import {SchemaActions} from './SchemaActions';
import i18n from './i18n';
import {b} from './shared';
import {transformPath} from './transformPath';

import './ObjectSummary.scss';

const getTenantCommonInfoState = () => {
    const collapsed = Boolean(localStorage.getItem(DEFAULT_IS_TENANT_COMMON_INFO_COLLAPSED));

    return {
        triggerExpand: false,
        triggerCollapse: false,
        collapsed,
    };
};

interface ObjectSummaryProps {
    type?: EPathType;
    subType?: EPathSubType;
    tenantName: string;
    path: string;
    onCollapseSummary: VoidFunction;
    onExpandSummary: VoidFunction;
    isCollapsed: boolean;
}

export function ObjectSummary({
    type,
    subType,
    tenantName,
    path,
    onCollapseSummary,
    onExpandSummary,
    isCollapsed,
}: ObjectSummaryProps) {
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const dispatch = useTypedDispatch();
    const [, setCurrentPath] = useQueryParam('schema', StringParam);
    const [commonInfoVisibilityState, dispatchCommonInfoVisibilityState] = React.useReducer(
        paneVisibilityToggleReducerCreator(DEFAULT_IS_TENANT_COMMON_INFO_COLLAPSED),
        undefined,
        getTenantCommonInfoState,
    );
    const {summaryTab = TENANT_SUMMARY_TABS_IDS.overview} = useTypedSelector(
        (state) => state.tenant,
    );

    const location = useLocation();

    const queryParams = qs.parse(location.search, {
        ignoreQueryPrefix: true,
    });

    const {currentData} = overviewApi.useGetOverviewQuery(
        {
            paths: [path],
            database: tenantName,
        },
        {
            pollingInterval: autoRefreshInterval,
        },
    );
    const {data: currentObjectData} = currentData ?? {};
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
                    <Tabs
                        size="l"
                        items={tabsItems}
                        activeTab={summaryTab}
                        wrapTo={({id}, node) => {
                            const path = createHref(routes.tenant, undefined, {
                                ...queryParams,
                                name: tenantName,
                                [TenantTabsGroups.summaryTab]: id,
                            });
                            return (
                                <Link to={path} key={id} className={b('tab')}>
                                    {node}
                                </Link>
                            );
                        }}
                        allowNotSelected
                    />
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

        const overview: InfoViewerItem[] = [];

        overview.push({label: i18n('field_type'), value: PathType?.replace(/^EPathType/, '')});

        if (PathSubType !== EPathSubType.EPathSubTypeEmpty) {
            overview.push({
                label: i18n('field_subtype'),
                value: PathSubType?.replace(/^EPathSubType/, ''),
            });
        }

        overview.push({label: i18n('field_id'), value: PathId});

        overview.push({label: i18n('field_version'), value: PathVersion});

        overview.push({
            label: i18n('field_created'),
            value: formatDateTime(CreateStep),
        });

        const {PathDescription} = currentObjectData;

        if (PathDescription?.TableStats) {
            const {DataSize, RowCount} = PathDescription.TableStats;

            overview.push(
                {
                    label: i18n('field_data-size'),
                    value: toFormattedSize(DataSize),
                },
                {
                    label: i18n('field_row-count'),
                    value: formatNumber(RowCount),
                },
            );
        }

        const title = <EntityTitle data={PathDescription} />;

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
                    label: i18n('field_paths'),
                    value: paths,
                },
                {
                    label: i18n('field_shards'),
                    value: shards,
                },
            ];
        };

        const getPathTypeOverview: Record<EPathType, (() => InfoViewerItem[]) | undefined> = {
            [EPathType.EPathTypeInvalid]: undefined,
            [EPathType.EPathTypeDir]: undefined,
            [EPathType.EPathTypeTable]: () => [
                {
                    label: i18n('field_partitions'),
                    value: PathDescription?.TablePartitions?.length,
                },
            ],
            [EPathType.EPathTypeSubDomain]: getDatabaseOverview,
            [EPathType.EPathTypeTableIndex]: undefined,
            [EPathType.EPathTypeExtSubDomain]: getDatabaseOverview,
            [EPathType.EPathTypeColumnStore]: () => [
                {
                    label: i18n('field_partitions'),
                    value: PathDescription?.ColumnStoreDescription?.ColumnShards?.length,
                },
            ],
            [EPathType.EPathTypeColumnTable]: () => [
                {
                    label: i18n('field_partitions'),
                    value: PathDescription?.ColumnTableDescription?.Sharding?.ColumnShards?.length,
                },
            ],
            [EPathType.EPathTypeCdcStream]: () => {
                const {Mode, Format} = PathDescription?.CdcStreamDescription || {};

                return [
                    {
                        label: i18n('field_mode'),
                        value: Mode?.replace(/^ECdcStreamMode/, ''),
                    },
                    {
                        label: i18n('field_format'),
                        value: Format?.replace(/^ECdcStreamFormat/, ''),
                    },
                ];
            },
            [EPathType.EPathTypePersQueueGroup]: () => {
                const pqGroup = PathDescription?.PersQueueGroup;
                const value = pqGroup?.PQTabletConfig?.PartitionConfig?.LifetimeSeconds;

                return [
                    {
                        label: i18n('field_partitions'),
                        value: pqGroup?.Partitions?.length,
                    },
                    {
                        label: i18n('field_retention'),
                        value: value && formatSecondsToHours(value),
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
                    {label: i18n('field_source-type'), value: SourceType},
                    {
                        label: i18n('field_data-source'),
                        value: DataSourcePath && (
                            <span title={DataSourcePath}>
                                <LinkWithIcon title={dataSourceName || ''} url={pathToDataSource} />
                            </span>
                        ),
                    },
                ];
            },
            [EPathType.EPathTypeExternalDataSource]: () => [
                {
                    label: i18n('field_source-type'),
                    value: PathDescription?.ExternalDataSourceDescription?.SourceType,
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
                        label: i18n('field_state'),
                        value: <AsyncReplicationState state={state} />,
                    },
                ];
            },
        };

        const pathTypeOverview = (PathType && getPathTypeOverview[PathType]?.()) || [];
        overview.push(...pathTypeOverview);

        // filter all empty values in according this requirement
        // https://github.com/ydb-platform/ydb-embedded-ui/issues/906
        return <InfoViewer title={title} info={overview.filter((i) => i.value)} />;
    };

    const renderTabContent = () => {
        switch (summaryTab) {
            case TENANT_SUMMARY_TABS_IDS.acl: {
                return <Acl path={path} database={tenantName} />;
            }
            case TENANT_SUMMARY_TABS_IDS.schema: {
                return <SchemaViewer type={type} path={path} tenantName={tenantName} />;
            }
            default: {
                return renderObjectOverview();
            }
        }
    };

    const onCollapseInfoHandler = () => {
        dispatchCommonInfoVisibilityState(PaneVisibilityActionTypes.triggerCollapse);
    };
    const onExpandInfoHandler = () => {
        dispatchCommonInfoVisibilityState(PaneVisibilityActionTypes.triggerExpand);
    };

    const onSplitStartDragAdditional = () => {
        dispatchCommonInfoVisibilityState(PaneVisibilityActionTypes.clear);
    };

    const renderCommonInfoControls = () => {
        const showPreview = isTableType(type) && !isIndexTableType(subType);
        return (
            <React.Fragment>
                {showPreview &&
                    getSummaryControls(
                        dispatch,
                        {setActivePath: setCurrentPath},
                        'm',
                    )(path, 'preview')}
                <ClipboardButton
                    text={path}
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

        let message;
        if (!type && Status && Reason) {
            message = `${Status}: ${Reason}`;
        }

        return type ? (
            <div className={b('entity-type')}>{type.replace('EPathType', '')}</div>
        ) : (
            <div className={b('entity-type', {error: true})}>
                <HelpPopover content={message} offset={{left: 0}} />
            </div>
        );
    };

    const renderContent = () => {
        return (
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
                        <ObjectTree tenantName={tenantName} path={path} />
                        <div className={b('info')}>
                            <div className={b('sticky-top')}>
                                <div className={b('info-header')}>
                                    <div className={b('info-title')}>
                                        {renderEntityTypeBadge()}
                                        <div className={b('path-name')}>
                                            {transformPath(path, tenantName)}
                                        </div>
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
                <PaneVisibilityToggleButtons
                    onCollapse={onCollapseSummary}
                    onExpand={onExpandSummary}
                    isCollapsed={isCollapsed}
                    initialDirection="left"
                    className={b('action-button')}
                />
            </div>
        );
    };

    return renderContent();
}
