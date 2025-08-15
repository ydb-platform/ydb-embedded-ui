import type {ValueOf} from '../../types/common';

import i18n from './i18n';

export const NODE_TYPES = {
    storage: 'storage',
    database: 'database',
    other: 'other',
};

export type NodeType = ValueOf<typeof NODE_TYPES>;

export const NODE_TYPES_TITLE = {
    [NODE_TYPES.storage]: i18n('title_storage-nodes'),
    [NODE_TYPES.database]: i18n('title_database-nodes'),
    [NODE_TYPES.other]: i18n('title_other-nodes'),
};
