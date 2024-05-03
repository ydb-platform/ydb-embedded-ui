import DataTable from '@gravity-ui/react-data-table';

import {TableSkeleton} from '../../../../components/TableSkeleton/TableSkeleton';
import type {EPathType} from '../../../../types/api/schema';
import {cn} from '../../../../utils/cn';
import {DEFAULT_TABLE_SETTINGS} from '../../../../utils/constants';
import {useTypedSelector} from '../../../../utils/hooks';

import {
    SchemaViewerColumns,
    prepareColumnDescriptions,
    prepareFamilies,
    prepareSchemaTableColumns,
} from './helpers';

import './SchemaViewer.scss';

const b = cn('schema-viewer');

interface SchemaViewerProps {
    className?: string;
    type?: EPathType;
    path?: string;
    withFamilies?: boolean;
}

export const SchemaViewer = ({className, type, path, withFamilies = false}: SchemaViewerProps) => {
    const {data, loading} = useTypedSelector((state) => state.schema);
    const currentObjectData = path ? data[path] : undefined;

    const {columns, keyColumnIds} = prepareColumnDescriptions(type, currentObjectData);
    const families = prepareFamilies(currentObjectData);

    return (
        <div className={b(null, className)}>
            {loading ? (
                <TableSkeleton />
            ) : (
                <DataTable
                    theme="yandex-cloud"
                    data={columns}
                    columns={prepareSchemaTableColumns({
                        type,
                        b,
                        families,
                        keyColumnIds,
                        withFamilies,
                    })}
                    settings={DEFAULT_TABLE_SETTINGS}
                    initialSortOrder={{
                        columnId: SchemaViewerColumns.key,
                        order: DataTable.ASCENDING,
                    }}
                />
            )}
        </div>
    );
};
