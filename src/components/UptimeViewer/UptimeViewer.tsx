import React from 'react';

import {DefinitionList} from '@gravity-ui/uikit';

import {EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';
import {
    formatDateTime,
    getDowntimeFromDateFormatted,
    getUptimeFromDateFormatted,
} from '../../utils/dataFormatters/dataFormatters';
import {CellWithPopover} from '../CellWithPopover/CellWithPopover';

import i18n from './i18n';

interface NodeUptimeProps {
    StartTime?: string;
    DisconnectTime?: string;
}

export function NodeUptime({StartTime, DisconnectTime}: NodeUptimeProps) {
    let uptime: string | undefined;
    let content: React.ReactNode = null;

    if (DisconnectTime) {
        uptime = getDowntimeFromDateFormatted(DisconnectTime);
        content = (
            <DefinitionList.Item key={'DisconnectTime'} name={i18n('disconnect-time')}>
                {formatDateTime(DisconnectTime, {withTimeZone: true})}
            </DefinitionList.Item>
        );
    } else if (StartTime) {
        uptime = getUptimeFromDateFormatted(StartTime);
        content = (
            <DefinitionList.Item key={'StartTime'} name={i18n('start-time')}>
                {formatDateTime(StartTime, {withTimeZone: true})}
            </DefinitionList.Item>
        );
    }

    if (!uptime) {
        return EMPTY_DATA_PLACEHOLDER;
    }

    return (
        <CellWithPopover
            placement={['top', 'bottom']}
            disabled={!content}
            content={<DefinitionList responsive>{content}</DefinitionList>}
        >
            {uptime}
        </CellWithPopover>
    );
}

interface TabletUptimeProps {
    ChangeTime?: string;
}

export function TabletUptime({ChangeTime}: TabletUptimeProps) {
    let uptime: string | undefined;

    if (ChangeTime) {
        uptime = getUptimeFromDateFormatted(ChangeTime);
    }

    if (!uptime) {
        return EMPTY_DATA_PLACEHOLDER;
    }
    return (
        <CellWithPopover
            placement={['top', 'bottom']}
            content={
                <DefinitionList responsive>
                    <DefinitionList.Item key={'changeTime'} name={i18n('change-time')}>
                        {formatDateTime(ChangeTime, {withTimeZone: true})}
                    </DefinitionList.Item>
                </DefinitionList>
            }
        >
            {uptime}
        </CellWithPopover>
    );
}
