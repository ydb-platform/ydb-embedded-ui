import {LabelWithPopover} from '../../../../../components/LabelWithPopover';
import {LagPopoverContent} from '../../../../../components/LagPopoverContent';
import {cn} from '../../../../../utils/cn';
import i18n from '../i18n';
import {CONSUMERS_COLUMNS_IDS, CONSUMERS_COLUMNS_TITILES} from '../utils/constants';

import './Headers.scss';

const b = cn('ydb-diagnostics-consumers-columns-header');

export const ReadLagsHeader = () => (
    <LabelWithPopover
        className={b('lags')}
        text={CONSUMERS_COLUMNS_TITILES[CONSUMERS_COLUMNS_IDS.READ_LAGS]}
        popoverContent={<LagPopoverContent text={i18n('lagsPopover.readLags')} type="read" />}
    />
);
