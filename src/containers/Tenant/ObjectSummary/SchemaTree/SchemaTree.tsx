// todo: tableTree is very smart, so it is impossible to update it without re-render
// It is need change NavigationTree to dump component and pass props from parent component
// In this case we can store state of tree - uploaded entities, opened nodes, selected entity and so on
import React from 'react';

import {NavigationTree} from 'ydb-ui-components';

import {getConnectToDBDialog} from '../../../../components/ConnectToDB/ConnectToDBDialog';
import {
    useCreateDirectoryFeatureAvailable,
    useTopicDataAvailable,
} from '../../../../store/reducers/capabilities/hooks';
import {selectIsDirty, selectUserInput} from '../../../../store/reducers/query/query';
import {schemaApi} from '../../../../store/reducers/schema/schema';
import {tableSchemaDataApi} from '../../../../store/reducers/tableSchemaData';
import type {EPathType, TEvDescribeSchemeResult} from '../../../../types/api/schema';
import {uiFactory} from '../../../../uiFactory/uiFactory';
import {valueIsDefined} from '../../../../utils';
import {useTypedDispatch, useTypedSelector} from '../../../../utils/hooks';
import {getConfirmation} from '../../../../utils/hooks/withConfirmation/useChangeInputWithConfirmation';
import {getSchemaControls} from '../../utils/controls';
import {
    isChildlessPathType,
    mapPathTypeToNavigationTreeType,
    nodeTableTypeToPathType,
} from '../../utils/schema';
import {getActions} from '../../utils/schemaActions';
import type {DropdownItem, TreeNodeMeta} from '../../utils/types';
import {CreateDirectoryDialog} from '../CreateDirectoryDialog/CreateDirectoryDialog';
import {useDispatchTreeKey, useTreeKey} from '../UpdateTreeContext';
import {isDomain} from '../transformPath';

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
    const dispatch = useTypedDispatch();
    const input = useTypedSelector(selectUserInput);
    const isDirty = useTypedSelector(selectIsDirty);
    const [
        getTableSchemaDataQuery,
        {currentData: actionsSchemaData, isFetching: isActionsDataFetching},
    ] = tableSchemaDataApi.useLazyGetTableSchemaDataQuery();

    const isTopicPreviewAvailable = useTopicDataAvailable();

    const [createDirectoryOpen, setCreateDirectoryOpen] = React.useState(false);
    const [parentPath, setParentPath] = React.useState('');
    const setSchemaTreeKey = useDispatchTreeKey();
    const schemaTreeKey = useTreeKey();

    const rootNodeType = isDomain(databaseFullPath, rootType)
        ? 'database'
        : mapPathTypeToNavigationTreeType(rootType);

    const fetchPath = React.useCallback(
        async (path: string) => {
            let schemaData: TEvDescribeSchemeResult | undefined;

            do {
                const promise = dispatch(
                    schemaApi.endpoints.getSchema.initiate(
                        {path, database, databaseFullPath},
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

            const {PathDescription: {Children = []} = {}} = schemaData;

            const childItems = Children.map((childData) => {
                const {Name = '', PathType, PathSubType, ChildrenExist} = childData;

                const isChildless =
                    isChildlessPathType(PathType, PathSubType) ||
                    (valueIsDefined(ChildrenExist) && !ChildrenExist);

                return {
                    name: Name,
                    type: mapPathTypeToNavigationTreeType(PathType, PathSubType),
                    // FIXME: should only be explicitly set to true for tables with indexes
                    // at the moment of writing there is no property to determine this, fix later
                    expandable: !isChildless,
                    meta: {subType: PathSubType},
                };
            });

            return childItems;
        },
        [dispatch, database, databaseFullPath],
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

    const getTreeNodeActions = React.useMemo(() => {
        return getActions(
            dispatch,
            {
                setActivePath: onActivePathUpdate,
                showCreateDirectoryDialog: createDirectoryFeatureAvailable
                    ? handleOpenCreateDirectoryDialog
                    : undefined,
                getConfirmation: input && isDirty ? getConfirmation : undefined,
                getConnectToDBDialog,
                schemaData: actionsSchemaData,
                isSchemaDataLoading: isActionsDataFetching,
                hasMonitoring: typeof uiFactory.renderMonitoring === 'function',
            },
            databaseFullPath,
            database,
        );
    }, [
        actionsSchemaData,
        createDirectoryFeatureAvailable,
        dispatch,
        input,
        isActionsDataFetching,
        isDirty,
        onActivePathUpdate,
        databaseFullPath,
        database,
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
                    const pathType = nodeTableTypeToPathType[type];
                    if (isOpen && pathType) {
                        getTableSchemaDataQuery({path, database, type: pathType, databaseFullPath});
                    }

                    return [];
                }}
                renderAdditionalNodeElements={getSchemaControls(
                    dispatch,
                    {
                        setActivePath: onActivePathUpdate,
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
