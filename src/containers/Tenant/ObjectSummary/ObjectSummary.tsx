import React from 'react';

import {HelpPopover} from '@gravity-ui/components';
import {dateTimeParse} from '@gravity-ui/date-utils';
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
import {Loader} from '../../../components/Loader';
import SplitPane from '../../../components/SplitPane';
import {getEntityName} from '../../../containers/Tenant/utils';
import routes, {createHref} from '../../../routes';
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
    HOUR_IN_SECONDS,
} from '../../../utils/constants';
import {formatNumber} from '../../../utils/dataFormatters/dataFormatters';
import {useTypedDispatch, useTypedSelector} from '../../../utils/hooks';
import {isNumeric} from '../../../utils/utils';
import {Acl} from '../Acl/Acl';
import {ExternalDataSourceSummary} from '../Info/ExternalDataSource/ExternalDataSource';
import {ExternalTableSummary} from '../Info/ExternalTable/ExternalTable';
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
        if (!currentSchemaData) return undefined;
        const {CreateStep, PathType, PathSubType, PathId, PathVersion} = currentSchemaData;

        const overview: InfoViewerItem[] = [];

        // for any schema type
        overview.push({label: 'Type', value: PathType?.replace(/^EPathType/, '')});

        // show SubType if it's not EPathSubTypeEmpty
        if (PathSubType !== EPathSubType.EPathSubTypeEmpty) {
            overview.push({label: 'SubType', value: PathSubType?.replace(/^EPathSubType/, '')});
        }

        // show PathId
        // if you get 18446744073709551615 = ffffffff = 2n ** 64n - 1n =-1 в ui64
        // you need to ask @xeno0904 for help
        overview.push({label: 'Id', value: PathId});

        // show PathVersion
        overview.push({label: 'Version', value: PathVersion});

        // show created time if it's not 0
        if (isNumeric(CreateStep) && Number(CreateStep)) {
            overview.push({
                label: 'Created',
                value: dateTimeParse(Number(CreateStep))?.format('YYYY-MM-DD HH:mm'),
            });
        }

        const {PathDescription} = currentObjectData;
        const title = getEntityName(PathDescription);

        // Table: show Partitions count = len(TablePartitions)
        if (PathType === EPathType.EPathTypeTable) {
            overview.push({
                label: 'Partitions count',
                value: PathDescription?.TablePartitions?.length,
            });
        }

        // ColumnTable: show Partitions count = len(ColumnTableDescription.Sharding.ColumnShards)
        if (PathType === EPathType.EPathTypeColumnTable) {
            overview.push({
                label: 'Partitions count',
                value: PathDescription?.ColumnTableDescription?.Sharding?.ColumnShards?.length,
            });
        }

        // ColumnStore: show Partitions count = len(ColumnStoreDescription.ColumnShards)
        if (PathType === EPathType.EPathTypeColumnStore) {
            overview.push({
                label: 'Partitions count',
                value: PathDescription?.ColumnStoreDescription?.ColumnShards?.length,
            });
        }

        // ExtSubDomain: (database)
        // show Paths (DomainDescription.PathsInside)
        // show Shards (DomainDescription.ShardsInside)
        if (PathType === EPathType.EPathTypeExtSubDomain) {
            overview.push({
                label: 'Paths count',
                value: PathDescription?.DomainDescription?.PathsInside?.length,
            });
            overview.push({
                label: 'Shards count',
                value: PathDescription?.DomainDescription?.ShardsInside?.length,
            });
        }

        if (PathType === EPathType.EPathTypeReplication) {
            const state = PathDescription?.ReplicationDescription?.State;
            if (state) {
                overview.push({label: 'State', value: <AsyncReplicationState state={state} />});
            }
        }

        if (PathType === EPathType.EPathTypeCdcStream) {
            const {Mode, Format} = PathDescription?.CdcStreamDescription || {};

            overview.push({label: 'Mode', value: Mode?.replace(/^ECdcStreamMode/, '')});
            overview.push({
                label: 'Format',
                value: Format?.replace(/^ECdcStreamFormat/, ''),
            });
        }
        if (PathType === EPathType.EPathTypePersQueueGroup) {
            const pqGroup = PathDescription?.PersQueueGroup;

            overview.push({label: 'Partitions count', value: pqGroup?.Partitions?.length});

            const value = pqGroup?.PQTabletConfig?.PartitionConfig?.LifetimeSeconds;
            if (value) {
                const hours = (value / HOUR_IN_SECONDS).toFixed(2);
                overview.push({label: 'Retention', value: `${formatNumber(hours)} hours`});
            }
        }

        if (PathType === EPathType.EPathTypeExternalTable) {
            return <ExternalTableSummary data={currentObjectData} />;
        }
        if (PathType === EPathType.EPathTypeExternalDataSource) {
            return <ExternalDataSourceSummary data={currentObjectData} />;
        }

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
