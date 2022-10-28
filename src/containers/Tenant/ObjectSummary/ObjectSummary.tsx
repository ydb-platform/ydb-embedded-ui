import React, {ReactNode, useEffect, useReducer} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {Link} from 'react-router-dom';
import cn from 'bem-cn-lite';
import {useHistory, useLocation} from 'react-router';
import qs from 'qs';
import _ from 'lodash';

import {Button, HelpPopover, Loader, Tabs} from '@gravity-ui/uikit';

import SplitPane from '../../../components/SplitPane';
import {SchemaTree} from '../Schema/SchemaTree/SchemaTree';
import Acl from '../Acl/Acl';
import SchemaViewer from '../Schema/SchemaViewer/SchemaViewer';
import CopyToClipboard from '../../../components/CopyToClipboard/CopyToClipboard';
import InfoViewer from '../../../components/InfoViewer/InfoViewer';
import {
    CDCStreamOverview,
    PersQueueGroupOverview,
} from '../../../components/InfoViewer/schemaOverview';
import Icon from '../../../components/Icon/Icon';

import {EPathSubType, EPathType, TDirEntry} from '../../../types/api/schema';
import {isColumnEntityType, isIndexTable, isTableType} from '../utils/schema';

import {
    DEFAULT_IS_TENANT_COMMON_INFO_COLLAPSED,
    DEFAULT_SIZE_TENANT_SUMMARY_KEY,
} from '../../../utils/constants';
import {
    TenantGeneralTabsIds,
    TenantInfoTabsIds,
    TenantTabsGroups,
    TENANT_INFO_TABS,
    TENANT_SCHEMA_TAB,
} from '../TenantPages';
import routes, {createHref} from '../../../routes';
import {
    PaneVisibilityActionTypes,
    paneVisibilityToggleReducerCreator,
    PaneVisibilityToggleButtons,
} from '../utils/paneVisibilityToggleHelpers';
import {setShowPreview} from '../../../store/reducers/schema';
import {setTopLevelTab} from '../../../store/reducers/tenant';

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

function prepareOlapTableSchema(tableSchema: any) {
    const {Name, Schema = {}} = tableSchema;
    const {Columns, KeyColumnNames} = Schema;
    const KeyColumnIds = KeyColumnNames?.map((name: string) => {
        const column = Columns?.find((el: any) => el.Name === name);
        return column.Id;
    });

    return {
        Columns,
        KeyColumnNames,
        Name,
        KeyColumnIds,
    };
}

interface ObjectSummaryProps {
    type?: EPathType;
    subType?: EPathSubType;
    onCollapseSummary: VoidFunction;
    onExpandSummary: VoidFunction;
    isCollapsed: boolean;
    additionalTenantInfo?: any;
}

function ObjectSummary(props: ObjectSummaryProps) {
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
    } = useSelector((state: any) => state.schema);

    const location = useLocation();

    const history = useHistory();

    const queryParams = qs.parse(location.search, {
        ignoreQueryPrefix: true,
    });

    const {name: tenantName, info: infoTab} = queryParams;
    const pathData: TDirEntry | undefined = _.get(
        data[tenantName as string],
        'PathDescription.Self',
    );
    const currentSchemaData: TDirEntry | undefined = _.get(
        data[currentSchemaPath],
        'PathDescription.Self',
    );

    const tableSchema =
        currentItem?.PathDescription?.Table || currentItem?.PathDescription?.ColumnTableDescription;

    const schema =
        isTableType(props.type) && isColumnEntityType(props.type)
            ? prepareOlapTableSchema(tableSchema)
            : tableSchema;

    useEffect(() => {
        const {type} = props;
        const isTable = isTableType(type);

        if (type && !isTable && !TENANT_INFO_TABS.find((el) => el.id === infoTab)) {
            history.push({
                pathname: location.pathname,
                search: qs.stringify({...queryParams, info: TenantInfoTabsIds.overview}),
            });
        }
    }, [props.type]);

    const renderTabs = () => {
        const isTable = isTableType(props.type);
        const tabsItems = isTable ? [...TENANT_INFO_TABS, ...TENANT_SCHEMA_TAB] : TENANT_INFO_TABS;

        return (
            <div className={b('tabs')}>
                <Tabs
                    size="l"
                    items={tabsItems}
                    activeTab={infoTab as string}
                    wrapTo={({id}, node) => {
                        const path = createHref(routes.tenant, undefined, {
                            ...queryParams,
                            name: tenantName as string,
                            [TenantTabsGroups.info]: id,
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
            [EPathType.EPathTypeCdcStream]: () => (
                <CDCStreamOverview data={data[currentSchemaPath]} />
            ),
            [EPathType.EPathTypePersQueueGroup]: () => (
                <PersQueueGroupOverview data={data[currentSchemaPath]} />
            ),
        };

        let component =
            currentSchemaData?.PathType && pathTypeToComponent[currentSchemaData.PathType]?.();

        if (!component) {
            const startTimeInMilliseconds = Number(currentSchemaData?.CreateStep);
            let createTime = '';
            if (startTimeInMilliseconds) {
                createTime = new Date(startTimeInMilliseconds).toUTCString();
            }

            component = <InfoViewer info={[{label: 'Create time', value: createTime}]} />;
        }

        return <div className={b('overview-wrapper')}>{component}</div>;
    };

    const renderTabContent = () => {
        switch (infoTab) {
            case TenantInfoTabsIds.acl: {
                return <Acl additionalTenantInfo={props.additionalTenantInfo} />;
            }
            case TenantInfoTabsIds.schema: {
                return loadingSchema ? (
                    renderLoader()
                ) : (
                    <div className={b('schema')}>
                        <SchemaViewer data={schema} />
                    </div>
                );
            }
            default: {
                return renderObjectOverview();
            }
        }
    };

    const renderLoader = () => {
        return (
            <div className={b('loader')}>
                <Loader size="m" />
            </div>
        );
    };

    const renderTree = () => {
        return (
            <div className={b('tree-wrapper')}>
                <div className={b('tree-header')}>
                    <div className={b('tree-title')}>Navigation</div>
                </div>
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
        dispatch(setTopLevelTab(TenantGeneralTabsIds.query));
    };

    const renderCommonInfoControls = () => {
        const showPreview = isTableType(props.type) && !isIndexTable(props.subType);
        return (
            <React.Fragment>
                {showPreview && (
                    <Button view="flat-secondary" onClick={onOpenPreview} title="Show preview">
                        <Icon name="tablePreview" viewBox={'0 0 16 16'} height={16} width={16} />
                    </Button>
                )}
                <CopyToClipboard text={currentSchemaPath} title="Copy schema path" />
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
        const {type} = props;
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
                <div className={b({hidden: props.isCollapsed})}>
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
                    onCollapse={props.onCollapseSummary}
                    onExpand={props.onExpandSummary}
                    isCollapsed={props.isCollapsed}
                    initialDirection="left"
                    className={b('action-button')}
                />
            </div>
        );
    };

    return renderContent();
}

export default ObjectSummary;
