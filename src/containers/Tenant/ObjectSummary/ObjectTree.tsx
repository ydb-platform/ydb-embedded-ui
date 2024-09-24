import {StringParam, useQueryParam} from 'use-query-params';

import {Loader} from '../../../components/Loader';
import {useGetSchemaQuery} from '../../../store/reducers/schema/schema';
import {SchemaTree} from '../Schema/SchemaTree/SchemaTree';

import i18n from './i18n';
import {b} from './shared';

interface ObjectTreeProps {
    tenantName: string;
    path?: string;
}

export function ObjectTree({tenantName, path}: ObjectTreeProps) {
    const {data: tenantData = {}, isLoading} = useGetSchemaQuery({
        path: tenantName,
        database: tenantName,
    });
    const pathData = tenantData?.PathDescription?.Self;

    const [, setCurrentPath] = useQueryParam('schema', StringParam);

    if (!pathData && isLoading) {
        // If Loader isn't wrapped with div, SplitPane doesn't calculate panes height correctly
        return (
            <div>
                <Loader />
            </div>
        );
    }

    return (
        <div className={b('tree-wrapper')}>
            <div className={b('tree-header')}>{i18n('title_navigation')}</div>
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
