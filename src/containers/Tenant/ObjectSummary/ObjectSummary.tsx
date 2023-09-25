import React, {ReactNode, useEffect, useReducer} from 'react';
import {useDispatch} from 'react-redux';
import {useLocation} from 'react-router';
import {Link} from 'react-router-dom';
import qs from 'qs';
import cn from 'bem-cn-lite';

import {Button, HelpPopover, Tabs} from '@gravity-ui/uikit';

import SplitPane from '../../../components/SplitPane';
import CopyToClipboard from '../../../components/CopyToClipboard/CopyToClipboard';
import InfoViewer from '../../../components/InfoViewer/InfoViewer';
import {
    CDCStreamOverview,
    PersQueueGroupOverview,
} from '../../../components/InfoViewer/schemaOverview';
import {Icon} from '../../../components/Icon';
import {Loader} from '../../../components/Loader';

import {
    EPathSubType,
    EPathType,
    TColumnDescription,
    TColumnTableDescription,
} from '../../../types/api/schema';
import routes, {createHref} from '../../../routes';
import {formatDateTime} from '../../../utils/dataFormatters/dataFormatters';
import {useTypedSelector} from '../../../utils/hooks';
import {
    DEFAULT_IS_TENANT_COMMON_INFO_COLLAPSED,
    DEFAULT_SIZE_TENANT_SUMMARY_KEY,
} from '../../../utils/constants';
import {setShowPreview} from '../../../store/reducers/schema/schema';
import {setQueryTab, setSummaryTab, setTenantPage} from '../../../store/reducers/tenant/tenant';
import {
    TENANT_PAGES_IDS,
    TENANT_QUERY_TABS_ID,
    TENANT_SUMMARY_TABS_IDS,
} from '../../../store/reducers/tenant/constants';

import {SchemaTree} from '../Schema/SchemaTree/SchemaTree';
import {SchemaViewer} from '../Schema/SchemaViewer/SchemaViewer';
import {Acl} from '../Acl/Acl';
import {ExternalTableSummary} from '../Info/ExternalTable/ExternalTable';
import {ExternalDataSourceSummary} from '../Info/ExternalDataSource/ExternalDataSource';

import {TenantTabsGroups, TENANT_INFO_TABS, TENANT_SCHEMA_TAB} from '../TenantPages';
import {
    PaneVisibilityActionTypes,
    paneVisibilityToggleReducerCreator,
    PaneVisibilityToggleButtons,
} from '../utils/paneVisibilityToggleHelpers';
import {isColumnEntityType, isExternalTable, isIndexTable, isTableType} from '../utils/schema';

import i18n from '../i18n';

import './ObjectSummary.scss';

const b = cn('object-summary');

const getInitialIsSummaryCollapsed = () => {
    return Boolean(localStorage.getItem(DEFAULT_IS_TENANT_COMMON_INFO_COLLAPSED));
};

const initialTenantCommonInfoState = {
    triggerExpand: false,
    triggerCollapse: false,
    collapsed: getInitialIsSummaryCollapsed(),
};

function prepareOlapTableSchema(tableSchema: TColumnTableDescription = {}) {
    const {Name, Schema} = tableSchema;

    if (Schema) {
        const {Columns, KeyColumnNames} = Schema;
        const KeyColumnIds = KeyColumnNames?.map((name: string) => {
            const column = Columns?.find((el) => el.Name === name);
            return column?.Id;
        }).filter((id): id is number => id !== undefined);

        return {
            Columns,
            KeyColumnNames,
            Name,
            KeyColumnIds,
        };
    }

    return {
        Name,
    };
}

interface ObjectSummaryProps {
    type?: EPathType;
    subType?: EPathSubType;
    onCollapseSummary: VoidFunction;
    onExpandSummary: VoidFunction;
    isCollapsed: boolean;
}

export function ObjectSummary({
    type,
    subType,
    onCollapseSummary,
    onExpandSummary,
    isCollapsed,
}: ObjectSummaryProps) {
    const dispatch = useDispatch();
    const [commonInfoVisibilityState, dispatchCommonInfoVisibilityState] = useReducer(
        paneVisibilityToggleReducerCreator(DEFAULT_IS_TENANT_COMMON_INFO_COLLAPSED),
        initialTenantCommonInfoState,
    );
    const {
        data,
        currentSchemaPath,
        currentSchema: currentItem = {},
        loading: loadingSchema,
    } = useTypedSelector((state) => state.schema);
    const {summaryTab = TENANT_SUMMARY_TABS_IDS.overview} = useTypedSelector(
        (state) => state.tenant,
    );

    const location = useLocation();

    const queryParams = qs.parse(location.search, {
        ignoreQueryPrefix: true,
    });

    const {name: tenantName} = queryParams;

    const pathData = tenantName ? data[tenantName.toString()]?.PathDescription?.Self : undefined;
    const currentObjectData = currentSchemaPath ? data[currentSchemaPath] : undefined;
    const currentSchemaData = currentObjectData?.PathDescription?.Self;

    let keyColumnIds: number[] | undefined;
    let columns: TColumnDescription[] | undefined;

    if (isTableType(type) && isColumnEntityType(type)) {
        const description = currentObjectData?.PathDescription?.ColumnTableDescription;
        const columnTableSchema = prepareOlapTableSchema(description);
        keyColumnIds = columnTableSchema.KeyColumnIds;
        columns = columnTableSchema.Columns;
    } else if (isExternalTable(type)) {
        columns = currentObjectData?.PathDescription?.ExternalTableDescription?.Columns;
    } else {
        keyColumnIds = currentObjectData?.PathDescription?.Table?.KeyColumnIds;
        columns = currentObjectData?.PathDescription?.Table?.Columns;
    }

    useEffect(() => {
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
                            name: tenantName as string,
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
        // verbose mapping to guarantee a correct render for new path types
        // TS will error when a new type is added but not mapped here
        const pathTypeToComponent: Record<EPathType, (() => ReactNode) | undefined> = {
            [EPathType.EPathTypeInvalid]: undefined,
            [EPathType.EPathTypeDir]: undefined,
            [EPathType.EPathTypeTable]: undefined,
            [EPathType.EPathTypeSubDomain]: undefined,
            [EPathType.EPathTypeTableIndex]: undefined,
            [EPathType.EPathTypeExtSubDomain]: undefined,
            [EPathType.EPathTypeColumnStore]: undefined,
            [EPathType.EPathTypeColumnTable]: undefined,
            [EPathType.EPathTypeCdcStream]: () => <CDCStreamOverview data={currentObjectData} />,
            [EPathType.EPathTypePersQueueGroup]: () => (
                <PersQueueGroupOverview data={currentObjectData} />
            ),
            [EPathType.EPathTypeExternalTable]: () => (
                <ExternalTableSummary data={currentObjectData} />
            ),
            [EPathType.EPathTypeExternalDataSource]: () => (
                <ExternalDataSourceSummary data={currentObjectData} />
            ),
        };

        let component =
            currentSchemaData?.PathType && pathTypeToComponent[currentSchemaData.PathType]?.();

        if (!component) {
            const startTimeInMilliseconds = Number(currentSchemaData?.CreateStep);
            let createTime = '';
            if (startTimeInMilliseconds) {
                createTime = formatDateTime(startTimeInMilliseconds);
            }

            component = <InfoViewer info={[{label: 'Create time', value: createTime}]} />;
        }

        return <div className={b('overview-wrapper')}>{component}</div>;
    };

    const renderLoader = () => {
        // If Loader isn't wrapped with div, SplitPane doesn't calculate panes height correctly
        return (
            <div>
                <Loader />
            </div>
        );
    };

    const renderTabContent = () => {
        switch (summaryTab) {
            case TENANT_SUMMARY_TABS_IDS.acl: {
                return <Acl />;
            }
            case TENANT_SUMMARY_TABS_IDS.schema: {
                return loadingSchema ? (
                    renderLoader()
                ) : (
                    <div className={b('schema')}>
                        <SchemaViewer keyColumnIds={keyColumnIds} columns={columns} type={type} />
                    </div>
                );
            }
            default: {
                return renderObjectOverview();
            }
        }
    };

    const renderTree = () => {
        return (
            <div className={b('tree-wrapper')}>
                <div className={b('tree-header')}>{i18n('summary.navigation')}</div>
                <div className={b('tree')}>
                    {pathData && (
                        <SchemaTree
                            rootPath={tenantName as string}
                            // for the root pathData.Name contains the same string as tenantName,
                            // but without the leading slash
                            rootName={pathData.Name || String(tenantName)}
                            rootType={pathData.PathType}
                            currentPath={currentSchemaPath}
                        />
                    )}
                </div>
            </div>
        );
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
        const showPreview = isTableType(type) && !isIndexTable(subType);
        return (
            <React.Fragment>
                {showPreview && (
                    <Button
                        view="flat-secondary"
                        onClick={onOpenPreview}
                        title={i18n('summary.showPreview')}
                    >
                        <Icon name="tablePreview" viewBox={'0 0 16 16'} height={16} width={16} />
                    </Button>
                )}
                {currentSchemaPath && (
                    <CopyToClipboard
                        text={currentSchemaPath}
                        title={i18n('summary.copySchemaPath')}
                    />
                )}
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
        const {Status, Reason} = currentItem;

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
        if (!tenantName) {
            return null;
        }
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
                        {currentSchemaPath ? renderTree() : renderLoader()}
                        <div className={b('info')}>
                            <div className={b('sticky-top')}>
                                <div className={b('info-header')}>
                                    <div className={b('info-title')}>
                                        {renderEntityTypeBadge()}
                                        <div className={b('path-name')}>{currentSchemaPath}</div>
                                    </div>
                                    <div className={b('info-controls')}>
                                        {renderCommonInfoControls()}
                                    </div>
                                </div>
                                {renderTabs()}
                            </div>
                            {renderTabContent()}
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
