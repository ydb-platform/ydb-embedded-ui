import type DataTable from '@gravity-ui/react-data-table';
import {getSortedData} from '@gravity-ui/react-data-table/build/esm/lib/util';

export function getDataTableOrder<T>(table: DataTable<T>) {
    const view = table.table;
    if (!view) {
        return [];
    }
    return getSortedData(
        view.props.data,
        view.getComplexColumns(view.props.columns).dataColumns,
        view.state,
        {
            nullBeforeNumbers: view.props.nullBeforeNumbers,
            externalSort: view.state.settings.externalSort,
        },
    ).map(({index}) => index);
}
