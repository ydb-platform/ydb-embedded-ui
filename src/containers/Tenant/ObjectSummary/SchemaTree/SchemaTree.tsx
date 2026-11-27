// todo: tableTree is very smart, so it is impossible to update it without re-render
// It is need change NavigationTree to dump component and pass props from parent component
// In this case we can store state of tree - uploaded entities, opened nodes, selected entity and so on
import React from 'react';

import {nanoid} from '@reduxjs/toolkit';
import {skipToken} from '@reduxjs/toolkit/query';
import type {NavigationTreeNodeType} from 'ydb-ui-components';
import {NavigationTree} from 'ydb-ui-components';

import {getConnectToDBDialog} from '../../../../components/ConnectToDB/ConnectToDBDialog';
import {backend, environment} from '../../../../store';
import {api} from '../../../../store/reducers/api';
import {
    useCreateDirectoryFeatureAvailable,
    useExecuteQueryAndForgetAvailable,
    useMultiTabQueryEditorEnabled,
    useTopicDataAvailable,
} from '../../../../store/reducers/capabilities/hooks';
import {useClusterBaseInfo, useClusterWithProxy} from '../../../../store/reducers/cluster/cluster';
import {operationsApi} from '../../../../store/reducers/operations';
import {selectIsDirty, selectUserInput} from '../../../../store/reducers/query/query';
import {schemaApi, setShowPreview} from '../../../../store/reducers/schema/schema';
import {showCreateTableApi} from '../../../../store/reducers/showCreateTable/showCreateTable';
import {streamingQueriesApi} from '../../../../store/reducers/streamingQuery/streamingQuery';
import {tableSchemaDataApi} from '../../../../store/reducers/tableSchemaData';
import {EPathType} from '../../../../types/api/schema';
import type {TEvDescribeSchemeResult} from '../../../../types/api/schema';
import {uiFactory} from '../../../../uiFactory/uiFactory';
import {wait} from '../../../../utils';
import {getStringifiedData} from '../../../../utils/dataFormatters/dataFormatters';
import {useEventHandler, useTypedDispatch, useTypedSelector} from '../../../../utils/hooks';
import {useCompactionFeature} from '../../../../utils/hooks/useCompactionFeature';
import {useSchemaSecretsFeature} from '../../../../utils/hooks/useSchemaSecretsFeature';
import {useTopicsSqlIoOperationsFeature} from '../../../../utils/hooks/useTopicsSqlIoOperationsFeature';
import {getConfirmation} from '../../../../utils/hooks/withConfirmation/useChangeInputWithConfirmation';
import {canShowTenantMonitoringTab} from '../../../../utils/monitoringVisibility';
import {findRunningTableCompactionOperation} from '../../../../utils/tableCompaction';
import {openCompactTableDialog} from '../../Diagnostics/Overview/TableInfo/CompactTableAction/CompactTableAction';
import {useTableCompaction} from '../../Diagnostics/Overview/TableInfo/hooks/useTableCompaction';
import {openTableFormDialog} from '../../TableFormDialog/TableFormDialog';
import type {FormMode} from '../../TableFormDialog/types';
import {useTenantPage} from '../../TenantNavigation/useTenantNavigation';
import {openTopicFormDialog} from '../../TopicFormDialog/TopicFormDialog';
import {isDocumentTable} from '../../utils';
import {getSchemaControls} from '../../utils/controls';
import {
    isChildlessPathType,
    mapPathTypeToNavigationTreeType,
    nodeStreamingQueryTypeToPathType,
    nodeTableTypeToPathType,
} from '../../utils/schema';
import {getActions} from '../../utils/schemaActions';
import type {DropdownItem, TreeNodeMeta} from '../../utils/types';
import {useDocumentTableDatabase} from '../../utils/useDocumentTableSchema';
import {useNavigationV2Enabled} from '../../utils/useNavigationV2Enabled';
import {CreateDirectoryDialog} from '../CreateDirectoryDialog/CreateDirectoryDialog';
import {useDispatchTreeKey, useTreeKey} from '../UpdateTreeContext';
import {isDomain, transformPath} from '../transformPath';

interface SchemaTreeProps {
    rootName: string;
    rootType?: EPathType;
    currentPath?: string;
    onActivePathUpdate: (path: string) => void;
    databaseFullPath: string;
    database: string;
}

export function SchemaTree(props: SchemaTreeProps) {
    const createDirectoryFeatureAvailable = useCreateDirectoryFeatureAvailable();
    const {rootName, rootType, currentPath, onActivePathUpdate, databaseFullPath, database} = props;
    const {
        clusterName,
        controlPlane,
        databaseData,
        connectionId,
        getTableContext,
        mayHaveDocumentTables,
    } = useDocumentTableDatabase({database, databaseFullPath});
    const scopeKey = JSON.stringify([
        environment,
        clusterName,
        backend,
        database,
        databaseFullPath,
    ]);
    const selection = React.useMemo(() => ({scopeKey, currentPath}), [scopeKey, currentPath]);
    const getCurrentSelection = useEventHandler(() => selection);
    const updateActivePath = useEventHandler(onActivePathUpdate);
    const databaseController = React.useRef<AbortController>();
    React.useEffect(() => {
        const controller = new AbortController();
        databaseController.current = controller;
        return () => controller.abort();
    }, [scopeKey]);
    const isCurrentDatabase = React.useCallback(
        () =>
            databaseController.current?.signal.aborted === false &&
            getCurrentSelection().scopeKey === scopeKey,
        [getCurrentSelection, scopeKey],
    );
    const dispatch = useTypedDispatch();
    const useMetaProxy = useClusterWithProxy();
    const isMultiTabEnabled = useMultiTabQueryEditorEnabled();
    const input = useTypedSelector(selectUserInput);
    const isDirty = useTypedSelector(selectIsDirty);
    const [menu, setMenu] = React.useState<{
        path: string;
        type: NavigationTreeNodeType;
        scopeKey: string;
    }>();
    const activeMenu = menu?.scopeKey === scopeKey ? menu : undefined;
    const schemaType = activeMenu ? nodeTableTypeToPathType[activeMenu.type] : undefined;
    const {
        currentData: actionsSchemaData,
        isFetching: isActionsDataFetching,
        isError: isActionsDataError,
    } = tableSchemaDataApi.useGetTableSchemaDataQuery(
        activeMenu && schemaType
            ? {
                  path: activeMenu.path,
                  database,
                  type: schemaType,
                  databaseFullPath,
                  useMetaProxy,
                  scopeKey,
              }
            : skipToken,
        {refetchOnMountOrArgChange: true},
    );
    const documentTablePath = actionsSchemaData?.isDocumentTable ? activeMenu?.path : undefined;
    const sqlRowMenu = activeMenu?.type === 'table' && documentTablePath === undefined;
    const [
        getStreamingQueryInfo,
        {currentData: streamingSysData, isFetching: isStreamingInfoFetching},
    ] = streamingQueriesApi.useLazyGetStreamingQueryInfoQuery();
    const {currentData: showCreateTableData, isFetching: isShowCreateTableFetching} =
        showCreateTableApi.useGetShowCreateTableQuery(
            activeMenu && (sqlRowMenu || activeMenu.type === 'column_table')
                ? {path: transformPath(activeMenu.path, databaseFullPath), database, scopeKey}
                : skipToken,
            {refetchOnMountOrArgChange: true},
        );

    const isTopicPreviewAvailable = useTopicDataAvailable();

    const {handleTenantPageChange} = useTenantPage();
    const isV2NavigationEnabled = useNavigationV2Enabled();

    const [createDirectoryOpen, setCreateDirectoryOpen] = React.useState(false);
    const [parentPath, setParentPath] = React.useState('');
    const setSchemaTreeKey = useDispatchTreeKey();
    const schemaTreeKey = useTreeKey();

    const refreshAfterDocumentTableChange = React.useCallback(
        async (tablePath: string, shouldExist: boolean, onConfirmed?: () => void) => {
            const signal = databaseController.current?.signal;
            if (!signal || !isCurrentDatabase()) {
                return;
            }

            const isActive = () => !signal.aborted && isCurrentDatabase();
            const deadline = Date.now() + 30_000;
            const separator = tablePath.lastIndexOf('/');
            const path = tablePath.slice(0, separator) || databaseFullPath;
            const folderArgs = {path, databaseFullPath, useMetaProxy};
            const name = tablePath.slice(separator + 1);

            while (isActive()) {
                const timeout = deadline - Date.now();
                if (timeout <= 0) {
                    break;
                }
                const folder = await window.api.viewer
                    .getSchema({database, path: folderArgs}, {signal, timeout})
                    .catch(() => null);
                if (folder?.Status === 'StatusSuccess' && folder.PathDescription) {
                    const present = folder.PathDescription.Children?.some(
                        (child) => child.Name === name,
                    );
                    if (Boolean(present) === shouldExist) {
                        await dispatch(
                            schemaApi.util.getRunningQueryThunk('getSchema', {
                                database,
                                ...folderArgs,
                            }),
                        );
                        if (isActive() && Date.now() < deadline) {
                            onConfirmed?.();
                        }
                        break;
                    }
                }
                const delay = Math.min(2_000, deadline - Date.now());
                if (!signal.aborted && delay > 0) {
                    await wait(delay);
                }
            }

            if (isActive()) {
                setSchemaTreeKey(nanoid());
            }
        },
        [database, databaseFullPath, dispatch, isCurrentDatabase, setSchemaTreeKey, useMetaProxy],
    );

    React.useEffect(() => {
        setMenu(undefined);
    }, [schemaTreeKey, scopeKey]);

    // Compaction feature flag check
    const {compactionEnabled} = useCompactionFeature(database);
    const {schemaSecretsEnabled} = useSchemaSecretsFeature(database);
    const {topicsSqlIoOperationsEnabled} = useTopicsSqlIoOperationsFeature(database);

    // Use table compaction hook to track all running compactions only while table actions are open
    const {
        operations: compactionOperations,
        isFetching: isCompactionFetching,
        refresh: refreshCompactions,
    } = useTableCompaction(database, '', compactionEnabled && sqlRowMenu);

    const executeQueryAndForgetAvailable = useExecuteQueryAndForgetAvailable();
    const [startTableCompaction] = operationsApi.useStartTableCompactionMutation();

    // Check if a specific table has running compaction
    const hasRunningCompaction = React.useCallback(
        (path: string) => {
            return Boolean(findRunningTableCompactionOperation(compactionOperations, path));
        },
        [compactionOperations],
    );

    const rootNodeType = isDomain(databaseFullPath, rootType)
        ? 'database'
        : mapPathTypeToNavigationTreeType(rootType);

    const fetchPath = React.useCallback(
        async (path: string) => {
            let schemaData: TEvDescribeSchemeResult | undefined;

            do {
                const promise = dispatch(
                    schemaApi.endpoints.getSchema.initiate(
                        {path, database, databaseFullPath, useMetaProxy},
                        {forceRefetch: true},
                    ),
                );

                const {data, originalArgs} = await promise;
                promise.unsubscribe();
                // Check if the result from the current request is reonceived. rtk-query may skip the current request and
                // return data from a parallel request, due to the same cache key.
                if (originalArgs?.path === path) {
                    schemaData = data?.[path];
                    break;
                }
                // eslint-disable-next-line no-constant-condition
            } while (true);

            if (!schemaData) {
                throw new Error(`No describe data about path ${path}`);
            }

            const children = schemaData.PathDescription?.Children ?? [];
            const parentIsDocumentTable =
                uiFactory.documentTables && isDocumentTable(schemaData.PathDescription);

            return children.map(({Name = '', PathType, PathSubType, ChildrenExist}) => ({
                name: Name,
                type: mapPathTypeToNavigationTreeType(PathType, PathSubType),
                expandable:
                    ChildrenExist !== false &&
                    !isChildlessPathType(PathType, PathSubType) &&
                    !(parentIsDocumentTable && PathType === EPathType.EPathTypeTableIndex),
                meta: {subType: PathSubType, parentIsDocumentTable},
            }));
        },
        [dispatch, database, databaseFullPath, useMetaProxy],
    );
    React.useEffect(() => {
        // if the cached path is not in the current tree, show root
        if (!currentPath?.startsWith(databaseFullPath)) {
            onActivePathUpdate(databaseFullPath);
        }
    }, [currentPath, onActivePathUpdate, databaseFullPath]);

    const handleSuccessSubmit = (relativePath: string) => {
        const newPath = `${parentPath}/${relativePath}`;
        onActivePathUpdate(newPath);
        setSchemaTreeKey(newPath);
    };

    const handleCloseDialog = () => {
        setCreateDirectoryOpen(false);
    };

    const handleOpenCreateDirectoryDialog = (value: string) => {
        setParentPath(value);
        setCreateDirectoryOpen(true);
    };

    const handleOpenCompactionDialog = React.useCallback(
        (path: string) => {
            openCompactTableDialog({
                onApply: async ({cascade, parallel}: {cascade: boolean; parallel?: number}) => {
                    return startTableCompaction({
                        database,
                        path,
                        cascade,
                        parallel,
                        executeAndForget: executeQueryAndForgetAvailable,
                    }).unwrap();
                },
                onRefreshCompactions: refreshCompactions,
                hasRunningCompaction: hasRunningCompaction(path),
                executeQueryAndForgetAvailable,
            });
        },
        [
            database,
            executeQueryAndForgetAvailable,
            startTableCompaction,
            hasRunningCompaction,
            refreshCompactions,
        ],
    );

    const handleOpenCreateTopicDialog = React.useCallback(
        (nextParentPath: string) => {
            openTopicFormDialog({
                mode: 'create',
                database,
                databaseFullPath,
                parentPath: nextParentPath,
                onSuccess: (createdPath) => {
                    onActivePathUpdate(createdPath);
                    setSchemaTreeKey(createdPath);
                },
            });
        },
        [database, databaseFullPath, onActivePathUpdate, setSchemaTreeKey],
    );

    const getCurrentTableContext = useEventHandler(getTableContext);
    const handleOpenTableDialog = React.useCallback(
        (mode: FormMode, path: string) => {
            const selectionAtOpen = getCurrentSelection();
            const databaseSignal = databaseController.current?.signal;
            const availableTypes =
                mode === 'create' && databaseData
                    ? uiFactory.getCreateTableTypes?.(databaseData)
                    : undefined;
            const canCreateDocumentTable = Boolean(
                connectionId && uiFactory.documentTables?.create,
            );
            openTableFormDialog({
                mode,
                ...(mode === 'create' ? {parentPath: path} : {path}),
                database,
                databaseFullPath,
                availableTypes: availableTypes?.filter(
                    (type) => type !== 'document' || canCreateDocumentTable,
                ),
                getDocumentTableContext: (tablePath) => {
                    const context = getCurrentTableContext(tablePath);
                    return context?.connectionId === connectionId ? context : undefined;
                },
                isCurrentDatabase: () => !databaseSignal?.aborted && isCurrentDatabase(),
                onRefresh: (tablePath, type, dialogOpen) => {
                    if (type === 'document') {
                        refreshAfterDocumentTableChange(tablePath, true, () => {
                            if (dialogOpen && getCurrentSelection() === selectionAtOpen) {
                                updateActivePath(tablePath);
                            }
                        });
                    } else {
                        updateActivePath(tablePath);
                        setSchemaTreeKey(tablePath);
                    }
                },
            });
        },
        [
            database,
            databaseFullPath,
            databaseData,
            connectionId,
            getCurrentTableContext,
            getCurrentSelection,
            isCurrentDatabase,
            refreshAfterDocumentTableChange,
            setSchemaTreeKey,
            updateActivePath,
        ],
    );

    const handleOpenUpdateTopicDialog = React.useCallback(
        (topicPath: string) => {
            openTopicFormDialog({
                mode: 'update',
                database,
                databaseFullPath,
                topicPath,
                onSuccess: (updatedPath) => {
                    onActivePathUpdate(updatedPath);
                    setSchemaTreeKey(updatedPath);
                },
            });
        },
        [database, databaseFullPath, onActivePathUpdate, setSchemaTreeKey],
    );

    const handleOpenDeleteDocumentTableDialog = React.useCallback(
        async (path: string) => {
            const context = getTableContext(path);
            const databaseSignal = databaseController.current?.signal;
            if (!context?.connectionId || !databaseSignal || !isCurrentDatabase()) {
                return;
            }
            const isCurrentContext = () =>
                !databaseSignal.aborted &&
                isCurrentDatabase() &&
                getCurrentTableContext(path)?.connectionId === context.connectionId;
            const accepted = await uiFactory.documentTables?.onDelete?.({
                context,
                isCurrentContext,
            });
            if (!accepted || !isCurrentContext()) {
                return;
            }
            const selectedPath = getCurrentSelection().currentPath;
            if (selectedPath === path || selectedPath?.startsWith(`${path}/`)) {
                updateActivePath(path.slice(0, path.lastIndexOf('/')) || databaseFullPath);
                dispatch(setShowPreview(false));
            }
            refreshAfterDocumentTableChange(path, false);
            dispatch(api.util.invalidateTags(['SchemaTree']));
        },
        [
            getTableContext,
            isCurrentDatabase,
            getCurrentTableContext,
            getCurrentSelection,
            updateActivePath,
            databaseFullPath,
            dispatch,
            refreshAfterDocumentTableChange,
        ],
    );

    const {monitoring: clusterMonitoring} = useClusterBaseInfo();
    const getTreeNodeActions = React.useMemo(() => {
        const hasMonitoring = canShowTenantMonitoringTab(controlPlane, clusterMonitoring);
        return getActions(
            dispatch,
            {
                setActivePath: onActivePathUpdate,
                setTenantPage: handleTenantPageChange,
                showCreateDirectoryDialog: createDirectoryFeatureAvailable
                    ? handleOpenCreateDirectoryDialog
                    : undefined,
                showCreateTableDialog: (path) => handleOpenTableDialog('create', path),
                showCreateTopicDialog: handleOpenCreateTopicDialog,
                showUpdateTableDialog: (path) => handleOpenTableDialog('update', path),
                showUpdateTopicDialog: handleOpenUpdateTopicDialog,
                isMultiTabEnabled,
                getConfirmation:
                    input && isDirty && !isMultiTabEnabled ? getConfirmation : undefined,
                getConnectToDBDialog,
                showCompactionDialog: compactionEnabled ? handleOpenCompactionDialog : undefined,
                hasRunningCompaction: compactionEnabled ? hasRunningCompaction : undefined,
                isCompactionLoading: isCompactionFetching,
                schemaData: actionsSchemaData?.schemaData,
                schemaDataPath: activeMenu?.path,
                isSchemaDataLoading: isActionsDataFetching,
                isSchemaDataError: isActionsDataError,
                documentTablePath,
                mayHaveDocumentTables:
                    Boolean(uiFactory.documentTables) && mayHaveDocumentTables !== false,
                showDeleteDocumentTableDialog:
                    documentTablePath &&
                    !isActionsDataError &&
                    uiFactory.documentTables?.onDelete &&
                    getTableContext(documentTablePath)?.connectionId
                        ? handleOpenDeleteDocumentTableDialog
                        : undefined,
                hasMonitoring,
                isV2NavigationEnabled,
                streamingQueryData: streamingSysData,
                showCreateTableData: getStringifiedData(showCreateTableData),
                isShowCreateTableLoading: isShowCreateTableFetching,
                isStreamingQueryTextLoading: isStreamingInfoFetching,
                schemaSecretsEnabled,
                topicsSqlIoOperationsEnabled,
            },
            databaseFullPath,
            database,
        );
    }, [
        controlPlane,
        getTableContext,
        handleOpenDeleteDocumentTableDialog,
        activeMenu,
        documentTablePath,
        mayHaveDocumentTables,
        clusterMonitoring,
        dispatch,
        onActivePathUpdate,
        handleTenantPageChange,
        createDirectoryFeatureAvailable,
        handleOpenTableDialog,
        handleOpenCreateTopicDialog,
        handleOpenUpdateTopicDialog,
        input,
        isDirty,
        isMultiTabEnabled,
        actionsSchemaData,
        isActionsDataFetching,
        isActionsDataError,
        isV2NavigationEnabled,
        streamingSysData,
        showCreateTableData,
        isShowCreateTableFetching,
        isStreamingInfoFetching,
        databaseFullPath,
        database,
        compactionEnabled,
        handleOpenCompactionDialog,
        hasRunningCompaction,
        isCompactionFetching,
        schemaSecretsEnabled,
        topicsSqlIoOperationsEnabled,
    ]);

    return (
        <React.Fragment>
            <CreateDirectoryDialog
                onClose={handleCloseDialog}
                open={createDirectoryOpen}
                database={database}
                databaseFullPath={databaseFullPath}
                parentPath={parentPath}
                onSuccess={handleSuccessSubmit}
            />
            <NavigationTree<DropdownItem, TreeNodeMeta>
                key={schemaTreeKey}
                rootState={{
                    path: databaseFullPath,
                    name: rootName,
                    type: rootNodeType,
                    collapsed: false,
                }}
                fetchPath={fetchPath}
                getActions={getTreeNodeActions}
                onActionsOpenToggle={({path, type, isOpen}) => {
                    if (isOpen) {
                        setMenu({path, type, scopeKey});
                    } else {
                        setMenu((current) =>
                            current?.path === path && current.scopeKey === scopeKey
                                ? undefined
                                : current,
                        );
                    }
                    const streamingPathType = nodeStreamingQueryTypeToPathType[type];
                    if (isOpen && streamingPathType) {
                        getStreamingQueryInfo({database, path}, true);
                    }
                }}
                renderAdditionalNodeElements={getSchemaControls(
                    dispatch,
                    {
                        setActivePath: onActivePathUpdate,
                        setTenantPage: handleTenantPageChange,
                    },
                    undefined,
                    isTopicPreviewAvailable,
                )}
                activePath={currentPath}
                onActivePathUpdate={onActivePathUpdate}
                cache={false}
                virtualize
            />
        </React.Fragment>
    );
}
