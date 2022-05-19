import {useDispatch} from 'react-redux';
import {useHistory} from 'react-router';

import {NavigationTree} from 'ydb-ui-components';

import {setCurrentSchemaPath, getSchema} from '../../../../store/reducers/schema';
import {getDescribe} from '../../../../store/reducers/describe';
import {getSchemaAcl} from '../../../../store/reducers/schemaAcl';

import {calcNavigationTreeType} from '../../utils/schema';
import {getActions} from '../../utils/schemaActions';

interface SchemaTreeProps {
    rootPath: string;
    rootName: string;
    rootType: string;
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
    const history = useHistory();

    const fetchPath = (path: string) => window.api.getSchema(
        {path},
        {concurrentId: `NavigationTree.getSchema|${path}`},
    )
        .then(({PathDescription: {Children = []} = {}}) => {
            return Children.map(({Name, PathType}) => ({
                name: Name,
                type: calcNavigationTreeType(PathType),
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
                type: calcNavigationTreeType(rootType),
                collapsed: false,
            }}
            fetchPath={fetchPath}
            getActions={getActions(dispatch, history, handleActivePathUpdate)}
            activePath={currentPath}
            onActivePathUpdate={handleActivePathUpdate}
            cache={false}
        />
    );
}
