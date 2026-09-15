import type DataTable from '@gravity-ui/react-data-table';
// The package root does not export the sorting function. Keep this compatibility seam
// isolated: using the table's own columns/state preserves nulls, groups and custom comparators.
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
