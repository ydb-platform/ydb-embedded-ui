import block from 'bem-cn-lite';

import {ReadLagImage} from '../../../../../components/LagImages';
import {LabelWithPopover} from '../../../../../components/LabelWithPopover';

import {CONSUMERS_COLUMNS_IDS, CONSUMERS_COLUMNS_TITILES} from '../utils/constants';

import i18n from '../i18n';

import './Headers.scss';

const b = block('ydb-diagnostics-consumers-columns-header');

export const ReadLagsHeader = () => (
    <LabelWithPopover
        className={b('lags')}
        headerText={CONSUMERS_COLUMNS_TITILES[CONSUMERS_COLUMNS_IDS.READ_LAGS]}
        popoverContent={
            <div className={b('lags-popover-content')}>
                <div>{i18n('lagsPopover.readLags')}</div>
                <div>
                    <ReadLagImage />
                </div>
            </div>
        }
    />
);
