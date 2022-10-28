import {useEffect} from 'react';
import {useDispatch} from 'react-redux';

import {NavigationTree} from 'ydb-ui-components';

import {setCurrentSchemaPath, getSchema, preloadSchemas} from '../../../../store/reducers/schema';
import {getDescribe} from '../../../../store/reducers/describe';
import {getSchemaAcl} from '../../../../store/reducers/schemaAcl';
import type {EPathType, TEvDescribeSchemeResult} from '../../../../types/api/schema';

import {checkIfPathNested, mapPathTypeToNavigationTreeType} from '../../utils/schema';
import {getActions} from '../../utils/schemaActions';

interface SchemaTreeProps {
    rootPath: string;
    rootName: string;
    rootType?: EPathType;
    currentPath: string;
}

export function SchemaTree(props: SchemaTreeProps) {
    const {rootPath, rootName, rootType, currentPath} = props;

    const dispatch = useDispatch();

    const fetchPath = (path: string) =>
        window.api
            .getSchema({path}, {concurrentId: `NavigationTree.getSchema|${path}`})
            .then((data) => {
                const {PathDescription: {Children = []} = {}} = data;

                const preloadedData: Record<string, TEvDescribeSchemeResult> = {
                    [path]: data,
                };

                const filteredChildren = Children.filter(
                    (child) =>
                        !checkIfPathNested(data.PathDescription?.Self?.PathType, child.PathType),
                );

                const childItems = filteredChildren.map((childData) => {
                    const {Name = '', PathType, PathSubType} = childData;

                    // not full data, but it contains PathType, which ensures seamless switch between nodes
                    preloadedData[`${path}/${Name}`] = {PathDescription: {Self: childData}};

                    return {
                        name: Name,
                        type: mapPathTypeToNavigationTreeType(PathType, PathSubType),
                        // FIXME: should only be explicitly set to true for tables with indexes
                        // at the moment of writing there is no property to determine this, fix later
                        expandable: true,
                    };
                });

                dispatch(preloadSchemas(preloadedData));

                return childItems;
            });

    const handleActivePathUpdate = (activePath: string) => {
        dispatch(setCurrentSchemaPath(activePath));
        dispatch(getSchema({path: activePath}));
        dispatch(getDescribe({path: activePath}));
        dispatch(getSchemaAcl({path: activePath}));
    };

    useEffect(() => {
        // if the cached path is not in the current tree, show root
        if (!currentPath.startsWith(rootPath)) {
            handleActivePathUpdate(rootPath);
        }
    }, []);

    return (
        <NavigationTree
            rootState={{
                path: rootPath,
                name: rootName,
                type: mapPathTypeToNavigationTreeType(rootType),
                collapsed: false,
            }}
            fetchPath={fetchPath}
            getActions={getActions(dispatch, handleActivePathUpdate)}
            activePath={currentPath}
            onActivePathUpdate={handleActivePathUpdate}
            cache={false}
            virtualize
        />
    );
}
