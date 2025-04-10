import React from 'react';

import {Button, Icon} from '@gravity-ui/uikit';

import type {InfoViewerItem} from '../../../../components/InfoViewer';
import {InfoViewer} from '../../../../components/InfoViewer';
import {YDBSyntaxHighlighter} from '../../../../components/SyntaxHighlighter/YDBSyntaxHighlighter';
import type {KeyValueRow} from '../../../../types/api/query';
import {cn} from '../../../../utils/cn';
import {formatDateTime, formatNumber} from '../../../../utils/dataFormatters/dataFormatters';
import {generateHash} from '../../../../utils/generateHash';
import {formatToMs, parseUsToMs} from '../../../../utils/timeParsers';

import i18n from './i18n';

import './QueryDetails.scss';

const b = cn('kv-query-details');

interface QueryDetailsProps {
    row: KeyValueRow;
    onClose: () => void;
    onOpenInEditor: () => void;
}

export const QueryDetails = ({row, onClose, onOpenInEditor}: QueryDetailsProps) => {
    const query = row.QueryText as string;
    // Create info items for the InfoViewer with formatting matching the columns
    const infoItems: InfoViewerItem[] = React.useMemo(() => {
        return [
            {label: i18n('query-details.query-hash'), value: generateHash(String(row.QueryText))},
            {
                label: i18n('query-details.cpu-time'),
                value: formatToMs(parseUsToMs(row.CPUTimeUs ?? undefined)),
            },
            {
                label: i18n('query-details.duration'),
                value: formatToMs(parseUsToMs(row.Duration ?? undefined)),
            },
            {label: i18n('query-details.read-bytes'), value: formatNumber(row.ReadBytes)},
            {label: i18n('query-details.request-units'), value: formatNumber(row.RequestUnits)},
            {
                label: i18n('query-details.end-time'),
                value: row.EndTime
                    ? formatDateTime(new Date(row.EndTime as string).getTime())
                    : '–',
            },
            {label: i18n('query-details.read-rows'), value: formatNumber(row.ReadRows)},
            {label: i18n('query-details.user-sid'), value: row.UserSID || '–'},
            {label: i18n('query-details.application-name'), value: row.ApplicationName || '–'},
            {
                label: i18n('query-details.query-start-at'),
                value: row.QueryStartAt
                    ? formatDateTime(new Date(row.QueryStartAt as string).getTime())
                    : '–',
            },
        ];
    }, [row]);

    return (
        <div className={b()}>
            <div className={b('header')}>
                <div className={b('title')}>Query</div>
                <div className={b('actions')}>
                    <Button view="flat" size="l" onClick={onClose} className={b('close-button')}>
                        <Icon data="close" size={16} />
                    </Button>
                </div>
            </div>

            <div className={b('content')}>
                <InfoViewer info={infoItems} />

                <div className={b('query-section')}>
                    <div className={b('query-header')}>
                        <div className={b('query-title')}>{i18n('query-details.query.title')}</div>
                        <Button
                            view="flat"
                            size="m"
                            onClick={onOpenInEditor}
                            className={b('editor-button')}
                        >
                            <Icon data="code" size={16} />
                            {i18n('query-details.open-in-editor')}
                        </Button>
                    </div>
                    <div className={b('query-content')}>
                        <YDBSyntaxHighlighter language="yql" text={query} withClipboardButton />
                    </div>
                </div>
            </div>
        </div>
    );
};
