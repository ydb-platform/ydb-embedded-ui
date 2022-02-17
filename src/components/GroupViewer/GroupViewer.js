import React from 'react';
import PropTypes from 'prop-types';
import cn from 'bem-cn-lite';

import EntityStatus from '../EntityStatus/EntityStatus';
import ProgressViewer from '../ProgressViewer/ProgressViewer';

import routes, {createHref} from '../../routes';
import {formatStorageValues, formatThroughput, formatIOPS} from '../../utils';

import './GroupViewer.scss';

const b = cn('group-viewer');

class GroupViewer extends React.Component {
    static propTypes = {
        group: PropTypes.object.isRequired,
        className: PropTypes.string,
    };

    static defaultProps = {
        className: '',
    };

    render() {
        const {group, className} = this.props;
        const {
            GroupID = 'no id',
            Overall = 'gray',
            VDisks,
            ErasureSpecies,
            Latency = 'gray',
            AcquiredIOPS,
            AcquiredSize,
            AcquiredThroughput,
            MaximumIOPS,
            MaximumSize,
            MaximumThroughput,
        } = group;
        if (group && Object.keys(group).length) {
            return (
                <div className={`${b()} ${className}`}>
                    <div className={b('group')}>
                        <EntityStatus
                            name={GroupID}
                            status={Overall}
                            path={createHref(routes.group, {id: GroupID})}
                            className={b('name')}
                        />
                    </div>

                    <div className={b('latency')}>
                        <EntityStatus name="Latency" status={Latency} />
                    </div>

                    <div className={b('label')}>{(VDisks && VDisks.length) || 0} Vdisks</div>
                    <div className={b('label')}>{ErasureSpecies || 'no ErasureSpecies info'}</div>
                    <div className={b('vdisks')}>
                        {VDisks?.map((disk) => (
                            <div key={disk.Guid} className={b('disk-overall')}>
                                <EntityStatus status={disk.Overall} />
                            </div>
                        ))}
                    </div>

                    <div className={b('progress')}>
                        <ProgressViewer
                            value={AcquiredSize}
                            capacity={MaximumSize}
                            colorizeProgress={true}
                            formatValues={formatStorageValues}
                        />
                    </div>

                    <div className={b('progress')}>
                        <ProgressViewer
                            value={AcquiredIOPS}
                            capacity={MaximumIOPS}
                            colorizeProgress={true}
                            formatValues={formatIOPS}
                        />
                    </div>

                    <div className={b('progress')}>
                        <ProgressViewer
                            value={AcquiredThroughput}
                            capacity={MaximumThroughput}
                            colorizeProgress={true}
                            formatValues={formatThroughput}
                        />
                    </div>
                </div>
            );
        } else {
            return <div className={b()}>No data</div>;
        }
    }
}

export default GroupViewer;
