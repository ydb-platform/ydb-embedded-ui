import React from 'react';
import PropTypes from 'prop-types';
import cn from 'bem-cn-lite';
import './SchemaViewer.scss';

import find from 'lodash/find';

import Icon from '../../../../components/Icon/Icon';

const b = cn('schema-viewer');

class SchemaViewer extends React.Component {
    static propTypes = {
        data: PropTypes.arrayOf(PropTypes.object),
    };
    render() {
        const {data = {}} = this.props;
        const keyColumnsIds = data.KeyColumnIds ?? [];
        const keyColumns = keyColumnsIds.map((key) => {
            const keyColumn = find(data.Columns, {Id: key});
            return keyColumn;
        });
        const restColumns = data.Columns?.filter((item) => !keyColumnsIds.includes(item.Id)) ?? [];

        const columns = [...keyColumns, ...restColumns];

        return (
            <div className={b()}>
                <div className={b('title')}>Schema</div>
                {columns.length > 0 ? (
                    <table className={b('table')}>
                        {columns.map((info, key) => (
                            <tr key={key} className={b('row')}>
                                <td>
                                    {keyColumnsIds.includes(info.Id) && (
                                        <div className={b('key-icon')}>
                                            <Icon
                                                name="key"
                                                viewBox="0 0 12 7"
                                                width={12}
                                                height={7}
                                            />
                                        </div>
                                    )}
                                </td>
                                <td className={b('type')}>
                                    <span>{info.Type}</span>
                                </td>
                                <td className={b('name')}>
                                    <span>{info.Name}</span>
                                </td>
                            </tr>
                        ))}
                    </table>
                ) : (
                    <div>no schema data</div>
                )}
            </div>
        );
    }
}

export default SchemaViewer;
