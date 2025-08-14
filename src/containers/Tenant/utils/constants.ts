import type {Settings} from '@gravity-ui/react-data-table';

import {DEFAULT_TABLE_SETTINGS} from '../../../utils/constants';

export const MAX_QUERY_HEIGHT = 6;

export const QUERY_TABLE_SETTINGS: Settings = {
    ...DEFAULT_TABLE_SETTINGS,
    dynamicRenderType: 'simple',
};
