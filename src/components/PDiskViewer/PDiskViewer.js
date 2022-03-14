import React from 'react';
import PropTypes from 'prop-types';
import cn from 'bem-cn-lite';

import ProgressViewer from '../ProgressViewer/ProgressViewer';
import EntityStatus from '../EntityStatus/EntityStatus';

import {formatStorageValues} from '../../utils';
import routes, {createHref} from '../../routes';

import {getDefaultNodePath} from '../../containers/Node/NodePages';

import './PDiskViewer.scss';

const b = cn('pdisk-viewer');

class PDiskViewer extends React.Component {
    static propTypes = {
        disk: PropTypes.object.isRequired,
        className: PropTypes.string,
    };

    static defaultProps = {
        className: '',
    };

    render() {
        const {disk, className} = this.props;

        if (disk) {
            return (
                <div className={`${b()} ${className}`}>
                    {disk && (
                        <div className={b('item')}>
                            <EntityStatus
                                status={disk.Realtime}
                                path={createHref(
                                    routes.pdisk,
                                    {id: disk.PDiskId},
                                    {node_id: disk.NodeId},
                                )}
                                label="PDiskID"
                                name={disk.PDiskId}
                            />
                        </div>
                    )}

                    {disk && (
                        <div className={b('item')}>
                            <EntityStatus
                                status={'green'}
                                label="NodeID"
                                path={getDefaultNodePath(disk.NodeId)}
                                name={disk.NodeId}
                            />
                        </div>
                    )}

                    {disk && (
                        <ProgressViewer
                            value={disk.TotalSize - disk.AvailableSize || 0}
                            capacity={disk.TotalSize || 0}
                            formatValues={formatStorageValues}
                            colorizeProgress={true}
                            className={b('size')}
                        />
                    )}
                    <div className={b('item')}>
                        {disk && <div className={b('label')}>{disk.Path || 'no path'}</div>}
                    </div>
                </div>
            );
        } else {
            return <div className="error">no PDisk data</div>;
        }
    }
}

export default PDiskViewer;
