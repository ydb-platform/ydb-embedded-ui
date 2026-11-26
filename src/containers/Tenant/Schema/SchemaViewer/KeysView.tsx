import {Label} from '@gravity-ui/uikit';

import {ContentWithPopup} from '../../../../components/ContentWithPopup/ContentWithPopup';
import {DOCUMENT_KEY_COLUMN_INDEX} from '../../utils';

import i18n from './i18n';
import {b} from './shared';
import type {SchemaData} from './types';
import {getPartitioningKeys, getPrimaryKeys} from './utils';

const MAX_VISIBLE_KEYS = 3;

interface KeysViewProps {
    tableData: SchemaData[];
    extended?: boolean;
    type: 'primary' | 'partitioning' | 'document-partition' | 'document-sort';
}

export const KeysView = ({tableData, extended, type}: KeysViewProps) => {
    let keys: string[];
    let title: string;
    switch (type) {
        case 'primary':
            keys = getPrimaryKeys(tableData);
            title = i18n('primary-key.title');
            break;
        case 'partitioning':
            keys = getPartitioningKeys(tableData);
            title = i18n('partitioning-key.title');
            break;
        case 'document-partition':
            keys = getPrimaryKeys(
                tableData.filter(
                    (column) => column.keyColumnIndex === DOCUMENT_KEY_COLUMN_INDEX.partition,
                ),
            );
            title = i18n('field_document-partition-key');
            break;
        case 'document-sort':
            keys = getPrimaryKeys(
                tableData.filter(
                    (column) => column.keyColumnIndex === DOCUMENT_KEY_COLUMN_INDEX.sort,
                ),
            );
            title = i18n('field_document-sort-key');
            break;
    }

    const visibleCount = extended ? MAX_VISIBLE_KEYS : keys.length;
    const visibleKeys = keys.slice(0, visibleCount);
    const hiddenKeys = keys.slice(visibleCount);

    return keys.length > 0 ? (
        <div className={b('keys', {summary: !extended, type})}>
            <div className={b('keys-header')}>{title}</div>
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
