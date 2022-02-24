import React from 'react';
import cn from 'bem-cn-lite';
import PropTypes from 'prop-types';

import DataTable from '@yandex-cloud/react-data-table';

import InfoViewer from '../InfoViewer/InfoViewer';
import EntityStatus from '../EntityStatus/EntityStatus';
import ProgressViewer from '../ProgressViewer/ProgressViewer';
import Breadcrumbs from '../Breadcrumbs/Breadcrumbs';

import {stringifyVdiskId, formatStorageValues} from '../../utils';
import {DEFAULT_TABLE_SETTINGS, PDISK_CATEGORIES} from '../../utils/constants';
import routes, {createHref} from '../../routes';

import './FullGroupViewer.scss';

const b = cn('full-group-viewer');

const tableSettings = {
    ...DEFAULT_TABLE_SETTINGS,
    stickyHead: DataTable.FIXED,
};

class FullGroupViewer extends React.Component {
    static propTypes = {
        className: PropTypes.string,
        group: PropTypes.object.isRequired,
    };

    static defaultProps = {
        className: '',
    };

    renderContent = () => {
        const {group} = this.props;
        const data = group.VDisks;
        const columns = [
            {
                name: 'VDiskId',
                header: 'VDisk',
                render: ({value, row}) => (
                    <EntityStatus
                        status={row.Overall}
                        name={stringifyVdiskId(value)}
                        path={createHref(routes.vdisk, null, {
                            vdiskId: stringifyVdiskId(value),
                        })}
                    />
                ),
            },
            {
                name: 'pdisk',
                header: 'PDisk',
                // eslint-disable-next-line no-confusing-arrow
                render: ({row}) =>
                    row.PDisk ? (
                        <EntityStatus
                            path={createHref(
                                routes.pdisk,
                                {id: row.PDisk.PDiskId},
                                {node_id: row.PDisk.NodeId},
                            )}
                            status={row.PDisk.Overall}
                            name={`${row.NodeId}-${row.PDisk.PDiskId}`}
                        />
                    ) : (
                        <div className="error">—</div>
                    ),
            },
            {
                name: 'space',
                header: 'Space',
                width: '150px',
                // eslint-disable-next-line no-confusing-arrow
                render: ({row}) =>
                    row.PDisk ? (
                        <ProgressViewer
                            capacity={row.PDisk.TotalSize}
                            value={row.PDisk.TotalSize - row.PDisk.AvailableSize}
                            formatValues={formatStorageValues}
                        />
                    ) : (
                        <div className="error">—</div>
                    ),
            },
            {
                name: 'category',
                header: 'Category',
                // eslint-disable-next-line no-confusing-arrow
                render: ({row}) =>
                    row.PDisk ? (
                        PDISK_CATEGORIES[row.PDisk.Category]
                    ) : (
                        <div className="error">—</div>
                    ),
                align: DataTable.RIGHT,
            },
            {
                name: 'path',
                header: 'Path',
                // eslint-disable-next-line no-confusing-arrow
                render: ({row}) => (row.PDisk ? row.PDisk.Path : <div className="error">—</div>),
            },
            {
                name: 'guid',
                header: 'Guid',
                // eslint-disable-next-line no-confusing-arrow
                render: ({row}) => (row.PDisk ? row.PDisk.Guid : <div className="error">—</div>),
                align: DataTable.RIGHT,
            },
        ];

        const groupInfo = [
            {label: 'Generation', value: group.GroupGeneration},
            {label: 'Latency', value: <EntityStatus status={group.Latency} />},
            {label: 'Erasure', value: group.ErasureSpecies},
        ];

        const breadcrumbsItems = [{text: 'Database'}, {text: 'Storage Pool'}, {text: 'BS Group'}];

        return (
            <React.Fragment>
                <Breadcrumbs items={breadcrumbsItems} />
                <InfoViewer className={b('section')} info={groupInfo} title={'Info'} />
                <DataTable
                    cls={b('disks')}
                    columns={columns}
                    data={data}
                    settings={tableSettings}
                />
            </React.Fragment>
        );
    };

    render() {
        const {className, group} = this.props;

        return (
            <div className={`${b()} ${className}`}>
                {group ? this.renderContent() : <div className="error">no group data</div>}
            </div>
        );
    }
}

export default FullGroupViewer;
