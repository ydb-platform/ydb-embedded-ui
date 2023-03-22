import block from 'bem-cn-lite';

import {LabelWithPopover} from '../../../../../components/LabelWithPopover';
import {LagPopover} from '../../../../../components/LagPopover';

import {PARTITIONS_COLUMNS_IDS, PARTITIONS_COLUMNS_TITILES} from '../utils/constants';

import i18n from '../i18n';

import './Headers.scss';

const b = block('ydb-diagnostics-partitions-columns-header');

interface MultilineHeaderProps {
    title: string;
}

export const MultilineHeader = ({title}: MultilineHeaderProps) => (
    <div className={b('multiline')}>{title}</div>
);

export const ReadSessionHeader = () => (
    <div className={b('read-session')}>
        {PARTITIONS_COLUMNS_TITILES[PARTITIONS_COLUMNS_IDS.READ_SESSION_ID]}
    </div>
);

export const WriteLagsHeader = () => (
    <LabelWithPopover
        className={b('lags')}
        text={PARTITIONS_COLUMNS_TITILES[PARTITIONS_COLUMNS_IDS.READ_LAGS]}
        content={<LagPopover text={i18n('lagsPopover.readLags')} type="read" />}
    />
);

export const ReadLagsHeader = () => (
    <LabelWithPopover
        className={b('lags')}
        text={PARTITIONS_COLUMNS_TITILES[PARTITIONS_COLUMNS_IDS.WRITE_LAGS]}
        content={<LagPopover text={i18n('lagsPopover.writeLags')} type="write" />}
    />
);

export const UnreadMessagesHeader = () => (
    <LabelWithPopover
        className={b('messages')}
        text={PARTITIONS_COLUMNS_TITILES[PARTITIONS_COLUMNS_IDS.UNREAD_MESSAGES]}
        content={<div className={b('messages-popover-content')}>{i18n('headers.unread')}</div>}
    />
);

export const UncommitedMessagesHeader = () => (
    <LabelWithPopover
        className={b('messages')}
        text={PARTITIONS_COLUMNS_TITILES[PARTITIONS_COLUMNS_IDS.UNCOMMITED_MESSAGES]}
        content={<div className={b('messages-popover-content')}>{i18n('headers.uncommited')}</div>}
    />
);
