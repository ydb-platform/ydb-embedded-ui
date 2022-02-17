import React from 'react';
import PropTypes from 'prop-types';
import cn from 'bem-cn-lite';
import './Info.scss';

import SchemaInfoViewer from '../../../Tenant/Schema/SchemaInfoViewer/SchemaInfoViewer';
import SchemaViewer from '../../../Tenant/Schema/SchemaViewer/SchemaViewer';
import {OLAP_TABLE_TYPE} from '../SchemaMain/SchemaMain';

const b = cn('schema-info');

function prepareOlapTableSchema(tableSchema) {
    const {Name, Schema = {}} = tableSchema;
    const {Columns, KeyColumnNames} = Schema;
    const KeyColumnIds = KeyColumnNames?.map((name) => {
        const column = Columns?.find((el) => el.Name === name);
        return column.Id;
    });

    return {
        Columns,
        KeyColumnNames,
        Name,
        KeyColumnIds,
    };
}

function prepareOlapTableGeneral(tableData, olapStats) {
    const {ColumnShardCount} = tableData;
    const Bytes = olapStats?.reduce((acc, el) => {
        acc += parseInt(el.Bytes) ?? 0;
        return acc;
    }, 0);
    const Rows = olapStats?.reduce((acc, el) => {
        acc += parseInt(el.Rows) ?? 0;
        return acc;
    }, 0);
    const tabletIds = olapStats?.reduce((acc, el) => {
        acc.add(el.TabletId);
        return acc;
    }, new Set());

    return {
        PathDescription: {
            TableStats: {
                ColumnShardCount,
                Bytes: Bytes?.toLocaleString('ru-RU', {useGrouping: true}) ?? 0,
                Rows: Rows?.toLocaleString('ru-RU', {useGrouping: true}) ?? 0,
                Parts: tabletIds?.size ?? 0,
            },
        },
    };
}

class Info extends React.Component {
    static propTypes = {
        fullPath: PropTypes.string,
        currentItem: PropTypes.string,
        tableSchema: PropTypes.object,
        olapStats: PropTypes.array,
        type: PropTypes.string,
    };
    render() {
        const {currentItem, tableSchema, olapStats} = this.props;
        const fullPath = currentItem.Path;

        const schema =
            this.props.type === OLAP_TABLE_TYPE ? prepareOlapTableSchema(tableSchema) : tableSchema;

        const data =
            this.props.type === OLAP_TABLE_TYPE
                ? prepareOlapTableGeneral(tableSchema, olapStats)
                : currentItem;

        return (
            <div className={b()}>
                <SchemaInfoViewer fullPath={fullPath} data={data} />
                {schema && <SchemaViewer data={schema} />}
            </div>
        );
    }
}

export default Info;
