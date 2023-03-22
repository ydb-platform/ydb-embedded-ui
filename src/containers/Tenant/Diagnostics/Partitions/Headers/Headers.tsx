import block from 'bem-cn-lite';

import {LabelWithPopover} from '../../../../../components/LabelWithPopover';
import {WriteLagImage, ReadLagImage} from '../../../../../components/LagImages';

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
        content={
            <div className={b('lags-popover-content')}>
                <div>{i18n('lagsPopover.writeLags')}</div>
                <div>
                    <WriteLagImage />
                </div>
            </div>
        }
    />
);

export const ReadLagsHeader = () => (
    <LabelWithPopover
        className={b('lags')}
        text={PARTITIONS_COLUMNS_TITILES[PARTITIONS_COLUMNS_IDS.WRITE_LAGS]}
        content={
            <div className={b('lags-popover-content')}>
                <div>{i18n('lagsPopover.readLags')}</div>
                <div>
                    <ReadLagImage />
                </div>
            </div>
        }
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
