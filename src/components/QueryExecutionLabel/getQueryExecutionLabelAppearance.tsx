import React from 'react';

import {CircleCheckFill, CircleQuestionFill, CircleStop, CircleXmark} from '@gravity-ui/icons';
import type {LabelProps} from '@gravity-ui/uikit';
import {Icon, Spin} from '@gravity-ui/uikit';

import type {QueryExecutionStatusType, StreamingStatus} from '../../store/reducers/query/types';

import i18n from './i18n';

export interface QueryExecutionStatusAppearance {
    icon: React.ReactNode;
    label: string;
    theme: LabelProps['theme'];
}

const STREAMING_STATUS_LABELS: Record<StreamingStatus, string> = {
    preparing: i18n('value_preparing'),
    running: i18n('value_running'),
    fetching: i18n('value_fetching'),
};

export function getQueryExecutionLabelAppearance(
    status: QueryExecutionStatusType,
    streamingStatus: StreamingStatus | undefined,
    extra: {iconSize: number},
): QueryExecutionStatusAppearance {
    const {iconSize} = extra;
    switch (status) {
        case 'loading':
            return {
                theme: 'info',
                icon: <Spin size="xs" />,
                label: streamingStatus
                    ? STREAMING_STATUS_LABELS[streamingStatus]
                    : i18n('value_running'),
            };
        case 'aborted':
            return {
                theme: 'danger',
                icon: <Icon data={CircleQuestionFill} size={iconSize} />,
                label: i18n('value_aborted'),
            };
        case 'stopped':
            return {
                theme: 'warning',
                icon: <Icon data={CircleStop} size={iconSize} />,
                label: i18n('value_stopped'),
            };
        case 'failed':
            return {
                theme: 'danger',
                icon: <Icon data={CircleXmark} size={iconSize} />,
                label: i18n('value_failed'),
            };
        case 'completed':
            return {
                theme: 'success',
                icon: <Icon data={CircleCheckFill} size={iconSize} />,
                label: i18n('value_completed'),
            };
    }
}
