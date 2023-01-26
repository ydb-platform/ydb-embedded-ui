import {useCallback, useEffect} from 'react';
import {useDispatch} from 'react-redux';

import {NavigationTree, NavigationTreeDataItem} from 'ydb-ui-components';

import {
    setCurrentSchemaPath,
    preloadSchemas,
    resetLoadingState,
} from '../../../../store/reducers/schema';
import type {EPathType, TEvDescribeSchemeResult} from '../../../../types/api/schema';

import {isChildlessPathType, mapPathTypeToNavigationTreeType} from '../../utils/schema';
import {getActions} from '../../utils/schemaActions';

interface SchemaTreeProps {
    rootPath: string;
    rootName: string;
    rootType?: EPathType;
    currentPath?: string;
}

export function SchemaTree(props: SchemaTreeProps) {
    const {rootPath, rootName, rootType, currentPath} = props;

    const dispatch = useDispatch();

    const fetchPath = (path: string): Promise<NavigationTreeDataItem[] | undefined> =>
        window.api
            .getSchema({path}, {concurrentId: `NavigationTree.getSchema|${path}`})
            .then((data) => {
                const {PathDescription: {Children = [], Self = {}} = {}} = data;
                const {PathType: SelfPathType, PathSubType: SelfPathSubType} = Self;

                const preloadedData: Record<string, TEvDescribeSchemeResult> = {
                    [path]: data,
                };

                const childItems = Children.map((childData) => {
                    const {Name = '', PathType, PathSubType} = childData;

                    // not full data, but it contains PathType, which ensures seamless switch between nodes
                    preloadedData[`${path}/${Name}`] = {PathDescription: {Self: childData}};

                    return {
                        name: Name,
                        type: mapPathTypeToNavigationTreeType(PathType, PathSubType),
                        // FIXME: should only be explicitly set to true for tables with indexes
                        // at the moment of writing there is no property to determine this, fix later
                        expandable: !isChildlessPathType(PathType, PathSubType),
                    };
                });

                dispatch(preloadSchemas(preloadedData));

                // Childless entities also include entities that have children,
                // which for some reason are hidden
                // In this case a user cannot navigate to them in the app
                // But can directly access them via url
                // To prevent it,tree rendering stops on childless component
                if (isChildlessPathType(SelfPathType, SelfPathSubType)) {
                    dispatch(setCurrentSchemaPath(path));
                    dispatch(resetLoadingState());

                    // NavigationTree renders nothing, when children are undefined
                    return undefined;
                }

                return childItems;
            });

    const handleActivePathUpdate = useCallback(
        (activePath: string) => {
            dispatch(setCurrentSchemaPath(activePath));
        },
        [dispatch],
    );

    useEffect(() => {
        // if the cached path is not in the current tree, show root
        if (currentPath && !currentPath.startsWith(rootPath)) {
            handleActivePathUpdate(rootPath);
        }
    }, [currentPath, rootPath, handleActivePathUpdate]);

    return (
        <NavigationTree
            rootState={{
                path: rootPath,
                name: rootName,
                type: mapPathTypeToNavigationTreeType(rootType),
                collapsed: false,
            }}
            // @ts-ignore
            fetchPath={fetchPath}
            getActions={getActions(dispatch, handleActivePathUpdate)}
            activePath={currentPath}
            onActivePathUpdate={handleActivePathUpdate}
            cache={false}
            virtualize
        />
    );
}
