import {useDispatch} from 'react-redux';

import {NavigationTree} from 'ydb-ui-components';

import {setCurrentSchemaPath, getSchema} from '../../../../store/reducers/schema';
import {getDescribe} from '../../../../store/reducers/describe';
import {getSchemaAcl} from '../../../../store/reducers/schemaAcl';
import type {EPathType} from '../../../../types/api/schema';

import {mapPathTypeToNavigationTreeType} from '../../utils/schema';
import {getActions} from '../../utils/schemaActions';

interface SchemaTreeProps {
    rootPath: string;
    rootName: string;
    rootType: EPathType;
    currentPath: string;
}

export function SchemaTree(props: SchemaTreeProps) {
    const {
        rootPath,
        rootName,
        rootType,
        currentPath,
    } = props;

    const dispatch = useDispatch();

    const fetchPath = (path: string) => window.api.getSchema(
        {path},
        {concurrentId: `NavigationTree.getSchema|${path}`},
    )
        .then(({PathDescription: {Children = []} = {}}) => {
            return Children.map(({Name = '', PathType}) => ({
                name: Name,
                type: mapPathTypeToNavigationTreeType(PathType),
            }));
        });

    const handleActivePathUpdate = (activePath: string) => {
        dispatch(setCurrentSchemaPath(activePath));
        dispatch(getSchema({path: activePath}));
        dispatch(getDescribe({path: activePath}));
        dispatch(getSchemaAcl({path: activePath}));
    };

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
        />
    );
}
