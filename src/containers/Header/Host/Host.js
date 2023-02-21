import React from 'react';
import PropTypes from 'prop-types';
import cn from 'bem-cn-lite';

import {Link as ExternalLink} from '@gravity-ui/uikit';

import EntityStatus from '../../../components/EntityStatus/EntityStatus';
import {Tag} from '../../../components/Tag';

import {calcUptime} from '../../../utils';
import {customBackend} from '../../../store';

import './Host.scss';

const b = cn('host');

export default class Host extends React.Component {
    static propTypes = {
        host: PropTypes.object,
        singleClusterMode: PropTypes.bool,
    };

    renderStatus = () => {
        const {host} = this.props;

        return (
            <div className={b('status')}>
                <EntityStatus size="m" status={host.SystemState} name={'Internal viewer'} />
            </div>
        );
    };

    render() {
        const {host, backend, singleClusterMode} = this.props;
        const uptime = calcUptime(host.StartTime);

        let link = backend + '/internal';

        if (singleClusterMode && !customBackend) {
            link = `/internal`;
        }

        return (
            <div className={b()}>
                <div className={b('common')}>
                    {link ? (
                        <ExternalLink href={link}>{this.renderStatus()}</ExternalLink>
                    ) : (
                        this.renderStatus()
                    )}
                    <Tag text={host.DataCenter} />
                </div>
                <div className={b('info')}>
                    <div className={b('info-item')}>
                        <div className={b('label')}>Uptime</div>
                        <div className={b('value')}>{uptime}</div>
                    </div>
                    <div className={b('info-item')}>
                        <div className={b('label')}>Version</div>
                        <div className={b('value')}>{host.Version}</div>
                    </div>
                </div>
            </div>
        );
    }
}
