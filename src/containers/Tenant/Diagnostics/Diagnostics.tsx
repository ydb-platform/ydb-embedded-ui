import {useCallback, useMemo} from 'react';
import qs from 'qs';
import cn from 'bem-cn-lite';
import {Link} from 'react-router-dom';
import {shallowEqual, useDispatch} from 'react-redux';
import {useLocation} from 'react-router';

import {Switch, Tabs} from '@gravity-ui/uikit';

import routes, {createHref} from '../../../routes';
import type {EPathSubType, EPathType} from '../../../types/api/schema';
import {useTypedSelector} from '../../../utils/hooks';
import {
    enableAutorefresh,
    disableAutorefresh,
    selectSchemaMergedChildrenPaths,
} from '../../../store/reducers/schema';
import {setTopLevelTab, setDiagnosticsTab} from '../../../store/reducers/tenant';

import {Loader} from '../../../components/Loader';

import Storage from '../../Storage/Storage';
import {Heatmap} from '../../Heatmap';
import {Tablets} from '../../Tablets';

import {TenantGeneralTabsIds, TenantTabsGroups} from '../TenantPages';
import {GeneralPagesIds, DATABASE_PAGES, getPagesByType} from './DiagnosticsPages';

import {
    isDatabaseEntityType,
    isEntityWithMergedImplementation,
    isMergedPathSubType,
} from '../utils/schema';

import {TopQueries} from './TopQueries';
import {OverloadedShards} from './OverloadedShards';
import {Consumers} from './Consumers';
import DetailedOverview from './DetailedOverview/DetailedOverview';
import Network from './Network/Network';
import Describe from './Describe/Describe';
import HotKeys from './HotKeys/HotKeys';
import Compute from './Compute/Compute';

import './Diagnostics.scss';

const b = cn('kv-tenant-diagnostics');

interface DiagnosticsProps {
    type?: EPathType;
    subType?: EPathSubType;
    additionalTenantInfo?: unknown;
    additionalNodesInfo?: unknown;
}

function Diagnostics(props: DiagnosticsProps) {
    const dispatch = useDispatch();
    const {currentSchemaPath, autorefresh} = useTypedSelector((state) => state.schema);
    const {diagnosticsTab, wasLoaded} = useTypedSelector((state) => state.tenant);

    const location = useLocation();

    const queryParams = qs.parse(location.search, {
        ignoreQueryPrefix: true,
    });

    const {name: rootTenantName} = queryParams;
    const tenantName = isDatabaseEntityType(props.type) ? currentSchemaPath : rootTenantName;
    const isDatabase = isDatabaseEntityType(props.type) || currentSchemaPath === rootTenantName;

    const pages = useMemo(() => {
        if (isDatabase) {
            return DATABASE_PAGES;
        }

        return getPagesByType(props.type);
    }, [props.type, isDatabase]);

    const forwardToDiagnosticTab = useCallback(
        (tab: GeneralPagesIds) => {
            dispatch(setDiagnosticsTab(tab));
        },
        [dispatch],
    );

    const activeTab = useMemo(() => {
        if (wasLoaded) {
            if (pages.find((el) => el.id === diagnosticsTab)) {
                return diagnosticsTab;
            } else {
                const newPage = pages[0].id;
                forwardToDiagnosticTab(newPage);
                return newPage;
            }
        }
        return undefined;
    }, [pages, diagnosticsTab, wasLoaded, forwardToDiagnosticTab]);

    let targetDataPath = currentSchemaPath;

    const mergedChildrenPaths = useTypedSelector(
        (state) => selectSchemaMergedChildrenPaths(state, currentSchemaPath, props.type),
        shallowEqual,
    );

    // For the case of direct access to merged entity (via saved link or OverloadedShards table)
    if (isMergedPathSubType(props.subType)) {
        targetDataPath = undefined;
    }

    if (isEntityWithMergedImplementation(props.type)) {
        targetDataPath = mergedChildrenPaths?.[0];
    }

    const onAutorefreshToggle = (value: boolean) => {
        if (value) {
            dispatch(enableAutorefresh());
        } else {
            dispatch(disableAutorefresh());
        }
    };

    const forwardToGeneralTab = (tab: TenantGeneralTabsIds) => {
        dispatch(setTopLevelTab(tab));
    };

    const renderTabContent = () => {
        const {type} = props;

        const tenantNameString = tenantName as string;

        switch (diagnosticsTab) {
            case GeneralPagesIds.overview: {
                return (
                    <DetailedOverview
                        type={type}
                        tenantName={tenantNameString}
                        additionalTenantInfo={props.additionalTenantInfo}
                    />
                );
            }
            case GeneralPagesIds.topQueries: {
                return (
                    <TopQueries
                        path={tenantNameString}
                        changeSchemaTab={forwardToGeneralTab}
                        type={type}
                    />
                );
            }
            case GeneralPagesIds.overloadedShards: {
                return (
                    <OverloadedShards
                        tenantPath={tenantNameString}
                        currentPath={targetDataPath}
                        type={type}
                    />
                );
            }
            case GeneralPagesIds.nodes: {
                return (
                    <Compute
                        tenantName={tenantNameString}
                        additionalNodesInfo={props.additionalNodesInfo}
                    />
                );
            }

            case GeneralPagesIds.storage: {
                return <Storage tenant={tenantNameString} database={true} />;
            }
            case GeneralPagesIds.describe: {
                return <Describe tenant={tenantNameString} type={type} />;
            }
            case GeneralPagesIds.network: {
                return <Network path={tenantNameString} />;
            }
            case GeneralPagesIds.tablets: {
                return <Tablets path={currentSchemaPath} />;
            }
            case GeneralPagesIds.hotKeys: {
                return <HotKeys path={targetDataPath} type={type} />;
            }
            case GeneralPagesIds.graph: {
                return <Heatmap path={targetDataPath} />;
            }
            case GeneralPagesIds.consumers: {
                return <Consumers path={targetDataPath} type={type} />;
            }
            default: {
                return <div>No data...</div>;
            }
        }
    };
    const renderTabs = () => {
        return (
            <div className={b('header-wrapper')}>
                <div className={b('tabs')}>
                    <Tabs
                        size="l"
                        items={pages}
                        activeTab={activeTab as string}
                        wrapTo={({id}, node) => {
                            const path = createHref(routes.tenant, undefined, {
                                ...queryParams,
                                [TenantTabsGroups.generalTab]: id,
                            });

                            return (
                                <Link to={path} key={id} className={b('tab')}>
                                    {node}
                                </Link>
                            );
                        }}
                        allowNotSelected={true}
                    />
                    <Switch
                        checked={autorefresh}
                        onUpdate={onAutorefreshToggle}
                        content="Autorefresh"
                    />
                </div>
            </div>
        );
    };

    // Loader prevents incorrect loading of tabs
    // After tabs are initially loaded it is no longer needed
    // Thus there is no also "loading" check as in other parts of the project
    if (!wasLoaded) {
        return <Loader size="l" />;
    }

    return (
        <div className={b()}>
            {renderTabs()}
            <div className={b('page-wrapper')}>{renderTabContent()}</div>
        </div>
    );
}

export default Diagnostics;
