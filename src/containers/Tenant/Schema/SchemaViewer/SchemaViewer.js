import React from 'react';
import PropTypes from 'prop-types';
import cn from 'bem-cn-lite';

import find from 'lodash/find';

import Icon from '../../../../components/Icon/Icon';
import DataTable from '@gravity-ui/react-data-table';
import {DEFAULT_TABLE_SETTINGS} from '../../../../utils/constants';
import './SchemaViewer.scss';

const b = cn('schema-viewer');

const SchemaViewerColumns = {
    id: 'Id',
    name: 'Name',
    key: 'Key',
    type: 'Type',
};

class SchemaViewer extends React.Component {
    static propTypes = {
        data: PropTypes.arrayOf(PropTypes.object),
    };

    renderTable() {
        const {data = {}} = this.props;
        const keyColumnsIds = data.KeyColumnIds ?? [];
        const keyColumns = keyColumnsIds.map((key) => {
            const keyColumn = find(data.Columns, {Id: key});
            return keyColumn;
        });
        const restColumns = data.Columns?.filter((item) => !keyColumnsIds.includes(item.Id)) ?? [];

        const columns = [
            {
                name: SchemaViewerColumns.id,
                width: 40,
            },
            {
                name: SchemaViewerColumns.key,
                width: 40,
                sortAccessor: (row) => {
                    return keyColumnsIds.includes(row.Id) ? 1 : 0;
                },
                render: ({row}) => {
                    return keyColumnsIds.includes(row.Id) ? (
                        <div className={b('key-icon')}>
                            <Icon name="key" viewBox="0 0 12 7" width={12} height={7} />
                        </div>
                    ) : null;
                },
            },
            {
                name: SchemaViewerColumns.name,
                width: 100,
            },
            {
                name: SchemaViewerColumns.type,
                width: 100,
            },
        ];

        const tableData = [...keyColumns, ...restColumns];
        return (
            <DataTable
                theme="yandex-cloud"
                data={tableData}
                columns={columns}
                settings={DEFAULT_TABLE_SETTINGS}
                dynamicRender={true}
                initialSortOrder={{columnId: SchemaViewerColumns.key, order: DataTable.DESCENDING}}
            />
        );
    }

    render() {
        return <div className={b()}>{this.renderTable()}</div>;
    }
}

export default SchemaViewer;
