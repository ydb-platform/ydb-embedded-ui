import {Loader} from '../../../components/Loader';
import {useGetSchemaQuery} from '../../../store/reducers/schema/schema';
import {useTenantQueryParams} from '../useTenantQueryParams';

import {SchemaTree} from './SchemaTree/SchemaTree';
import i18n from './i18n';
import {b} from './shared';

interface ObjectTreeProps {
    database: string;
    databaseFullPath: string;
    path?: string;
}

function prepareSchemaRootName(name: string | undefined, fallback: string): string {
    if (name) {
        return name.startsWith('/') ? name : `/${name}`;
    }

    return fallback.startsWith('/') ? fallback : `/${fallback}`;
}

export function ObjectTree({database, path, databaseFullPath}: ObjectTreeProps) {
    const {data: tenantData = {}, isLoading} = useGetSchemaQuery({
        path: databaseFullPath,
        databaseFullPath,
        database,
    });
    const pathData = tenantData?.PathDescription?.Self;

    const {handleSchemaChange} = useTenantQueryParams();

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
                        database={database}
                        databaseFullPath={databaseFullPath}
                        // ensure it has the leading slash
                        rootName={prepareSchemaRootName(pathData.Name, databaseFullPath)}
                        rootType={pathData.PathType}
                        currentPath={path}
                        onActivePathUpdate={handleSchemaChange}
                    />
                ) : null}
            </div>
        </div>
    );
}
