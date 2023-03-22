import block from 'bem-cn-lite';

import {LabelWithPopover} from '../../../../../components/LabelWithPopover';
import {LagPopover} from '../../../../../components/LagPopover';

import {CONSUMERS_COLUMNS_IDS, CONSUMERS_COLUMNS_TITILES} from '../utils/constants';

import i18n from '../i18n';

import './Headers.scss';

const b = block('ydb-diagnostics-consumers-columns-header');

export const ReadLagsHeader = () => (
    <LabelWithPopover
        className={b('lags')}
        text={CONSUMERS_COLUMNS_TITILES[CONSUMERS_COLUMNS_IDS.READ_LAGS]}
        content={<LagPopover text={i18n('lagsPopover.readLags')} type="read" />}
    />
);
