import {Label} from '@gravity-ui/uikit';

import {ContentWithPopup} from '../../../../components/ContentWithPopup/ContentWithPopup';

import i18n from './i18n';
import {b} from './shared';
import type {SchemaData} from './types';
import {getPartitioningKeys, getPrimaryKeys} from './utils';

const MAX_VISIBLE_KEYS = 3;

interface KeysViewProps {
    tableData: SchemaData[];
    extended?: boolean;
    type: 'primary' | 'partitioning';
}

export const KeysView = ({tableData, extended, type}: KeysViewProps) => {
    const keys = type === 'primary' ? getPrimaryKeys(tableData) : getPartitioningKeys(tableData);

    const visibleCount = extended ? MAX_VISIBLE_KEYS : keys.length;
    const visibleKeys = keys.slice(0, visibleCount);
    const hiddenKeys = keys.slice(visibleCount);

    return keys.length > 0 ? (
        <div className={b('keys', {summary: !extended, type})}>
            <div className={b('keys-header')}>
                {type === 'primary' ? i18n('primary-key.title') : i18n('partitioning-key.title')}
            </div>
            <div className={b('keys-values')}>
                {' ' + visibleKeys.join(', ')}
                {hiddenKeys.length ? (
                    <ContentWithPopup
                        className={b('more-badge')}
                        placement={['bottom']}
                        hasArrow={false}
                        pinOnClick
                        content={
                            <div className={b('popup-content')}>
                                {hiddenKeys.map((key) => (
                                    <div className={b('popup-item')} key={key}>
                                        {key}
                                    </div>
                                ))}
                            </div>
                        }
                    >
                        <Label className={b('keys-label')}>{`+${hiddenKeys.length}`}</Label>
                    </ContentWithPopup>
                ) : null}
            </div>
        </div>
    ) : null;
};
