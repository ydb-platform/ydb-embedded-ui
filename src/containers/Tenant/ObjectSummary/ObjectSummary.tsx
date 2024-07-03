import React from 'react';

import {HelpPopover} from '@gravity-ui/components';
import {LayoutHeaderCellsLargeFill} from '@gravity-ui/icons';
import {Button, Icon, Tabs} from '@gravity-ui/uikit';
import qs from 'qs';
import {useLocation} from 'react-router';
import {Link} from 'react-router-dom';
import {StringParam, useQueryParam} from 'use-query-params';

import {AsyncReplicationState} from '../../../components/AsyncReplicationState';
import {ClipboardButton} from '../../../components/ClipboardButton';
import InfoViewer from '../../../components/InfoViewer/InfoViewer';
import type {InfoViewerItem} from '../../../components/InfoViewer/InfoViewer';
import {LinkWithIcon} from '../../../components/LinkWithIcon/LinkWithIcon';
import {Loader} from '../../../components/Loader';
import SplitPane from '../../../components/SplitPane';
import routes, {createExternalUILink, createHref} from '../../../routes';
import {schemaApi, setShowPreview} from '../../../store/reducers/schema/schema';
import {
    TENANT_PAGES_IDS,
    TENANT_QUERY_TABS_ID,
    TENANT_SUMMARY_TABS_IDS,
} from '../../../store/reducers/tenant/constants';
import {setQueryTab, setSummaryTab, setTenantPage} from '../../../store/reducers/tenant/tenant';
import {EPathSubType, EPathType} from '../../../types/api/schema';
import {cn} from '../../../utils/cn';
import {
    DEFAULT_IS_TENANT_COMMON_INFO_COLLAPSED,
    DEFAULT_SIZE_TENANT_SUMMARY_KEY,
} from '../../../utils/constants';
import {formatDateTime, formatSecondsToHours} from '../../../utils/dataFormatters/dataFormatters';
import {useTypedDispatch, useTypedSelector} from '../../../utils/hooks';
import {Acl} from '../Acl/Acl';
import {EntityTitle} from '../EntityTitle/EntityTitle';
import {SchemaTree} from '../Schema/SchemaTree/SchemaTree';
import {SchemaViewer} from '../Schema/SchemaViewer/SchemaViewer';
import {TENANT_INFO_TABS, TENANT_SCHEMA_TAB, TenantTabsGroups} from '../TenantPages';
import i18n from '../i18n';
import {
    PaneVisibilityActionTypes,
    PaneVisibilityToggleButtons,
    paneVisibilityToggleReducerCreator,
} from '../utils/paneVisibilityToggleHelpers';
import {isIndexTableType, isTableType} from '../utils/schema';

import './ObjectSummary.scss';

const b = cn('object-summary');

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
    const dispatch = useTypedDispatch();
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

    const {currentData: currentObjectData} = schemaApi.endpoints.getSchema.useQueryState({path});
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
            </div>
        );
    };

    const renderObjectOverview = () => {
        if (!currentSchemaData) {
            return undefined;
        }
        const {CreateStep, PathType, PathSubType, PathId, PathVersion} = currentSchemaData;

        const overview: InfoViewerItem[] = [];

        overview.push({label: i18n('summary.type'), value: PathType?.replace(/^EPathType/, '')});

        if (PathSubType !== EPathSubType.EPathSubTypeEmpty) {
            overview.push({
                label: i18n('summary.subtype'),
                value: PathSubType?.replace(/^EPathSubType/, ''),
            });
        }

        overview.push({label: i18n('summary.id'), value: PathId});

        overview.push({label: i18n('summary.version'), value: PathVersion});

        overview.push({
            label: i18n('summary.created'),
            value: formatDateTime(CreateStep, ''),
        });

        const {PathDescription} = currentObjectData;

        const title = <EntityTitle data={PathDescription} />;

        const getPathTypeOverview: Record<EPathType, (() => InfoViewerItem[]) | undefined> = {
            [EPathType.EPathTypeInvalid]: undefined,
            [EPathType.EPathTypeDir]: undefined,
            [EPathType.EPathTypeTable]: () => [
                {
                    label: i18n('summary.partitions'),
                    value: PathDescription?.TablePartitions?.length,
                },
            ],
            [EPathType.EPathTypeSubDomain]: undefined,
            [EPathType.EPathTypeTableIndex]: undefined,
            [EPathType.EPathTypeExtSubDomain]: () => [
                {
                    label: i18n('summary.paths'),
                    value: PathDescription?.DomainDescription?.PathsInside,
                },
                {
                    label: i18n('summary.shards'),
                    value: PathDescription?.DomainDescription?.ShardsInside,
                },
            ],
            [EPathType.EPathTypeColumnStore]: () => [
                {
                    label: i18n('summary.partitions'),
                    value: PathDescription?.ColumnStoreDescription?.ColumnShards?.length,
                },
            ],
            [EPathType.EPathTypeColumnTable]: () => [
                {
                    label: i18n('summary.partitions'),
                    value: PathDescription?.ColumnTableDescription?.Sharding?.ColumnShards?.length,
                },
            ],
            [EPathType.EPathTypeCdcStream]: () => {
                const {Mode, Format} = PathDescription?.CdcStreamDescription || {};

                return [
                    {
                        label: i18n('summary.mode'),
                        value: Mode?.replace(/^ECdcStreamMode/, ''),
                    },
                    {
                        label: i18n('summary.format'),
                        value: Format?.replace(/^ECdcStreamFormat/, ''),
                    },
                ];
            },
            [EPathType.EPathTypePersQueueGroup]: () => {
                const pqGroup = PathDescription?.PersQueueGroup;
                const value = pqGroup?.PQTabletConfig?.PartitionConfig?.LifetimeSeconds;

                return [
                    {
                        label: i18n('summary.partitions'),
                        value: pqGroup?.Partitions?.length,
                    },
                    {
                        label: i18n('summary.retention'),
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
                    {label: i18n('summary.source-type'), value: SourceType},
                    {
                        label: i18n('summary.data-source'),
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
                    label: i18n('summary.source-type'),
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
                        label: i18n('summary.state'),
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
                return <Acl path={path} />;
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

    const onOpenPreview = () => {
        dispatch(setShowPreview(true));
        dispatch(setTenantPage(TENANT_PAGES_IDS.query));
        dispatch(setQueryTab(TENANT_QUERY_TABS_ID.newQuery));
    };

    const renderCommonInfoControls = () => {
        const showPreview = isTableType(type) && !isIndexTableType(subType);
        return (
            <React.Fragment>
                {showPreview && (
                    <Button
                        view="flat-secondary"
                        onClick={onOpenPreview}
                        title={i18n('summary.showPreview')}
                    >
                        <Icon data={LayoutHeaderCellsLargeFill} />
                    </Button>
                )}
                <ClipboardButton
                    text={path}
                    view="flat-secondary"
                    title={i18n('summary.copySchemaPath')}
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
                                        <div className={b('path-name')}>{path}</div>
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

function ObjectTree({tenantName, path}: {tenantName: string; path?: string}) {
    const {currentData: tenantData = {}, isFetching} = schemaApi.useGetSchemaQuery({
        path: tenantName,
    });
    const pathData = tenantData?.PathDescription?.Self;

    const [, setCurrentPath] = useQueryParam('schema', StringParam);

    if (!pathData && isFetching) {
        // If Loader isn't wrapped with div, SplitPane doesn't calculate panes height correctly
        return (
            <div>
                <Loader />
            </div>
        );
    }

    return (
        <div className={b('tree-wrapper')}>
            <div className={b('tree-header')}>{i18n('summary.navigation')}</div>
            <div className={b('tree')}>
                {pathData ? (
                    <SchemaTree
                        rootPath={tenantName}
                        // for the root pathData.Name contains the same string as tenantName,
                        // but without the leading slash
                        rootName={pathData.Name || tenantName}
                        rootType={pathData.PathType}
                        currentPath={path}
                        onActivePathUpdate={setCurrentPath}
                    />
                ) : null}
            </div>
        </div>
    );
}
