import type {TIndexDescription} from '../../../types/api/schema';
import type {
    TVectorIndexKmeansTreeDescriptionSettings,
    TVectorIndexKmeansTreeDescriptionSettingsInner,
} from '../../../types/api/schema/tableIndex';
import {formatNumber} from '../../../utils/dataFormatters/dataFormatters';
import type {InfoViewerItem} from '../InfoViewer';
import {formatTableIndexItem} from '../formatters';
import {createInfoFormatter} from '../utils';

import i18n from './i18n';

const DISPLAYED_FIELDS_KEYS = [
    'Type',
    'State',
    'DataSize',
    'KeyColumnNames',
    'DataColumnNames',
] as const;
type DisplayedIndexField = (typeof DISPLAYED_FIELDS_KEYS)[number];

export function getDisplayedIndexFields(): ReadonlySet<DisplayedIndexField> {
    return new Set<DisplayedIndexField>(DISPLAYED_FIELDS_KEYS);
}

export function buildIndexInfo(tableIndex?: TIndexDescription): InfoViewerItem[] {
    const info: InfoViewerItem[] = [];
    if (!tableIndex) {
        return info;
    }

    getDisplayedIndexFields().forEach((key) => {
        const value = tableIndex[key];
        if (value !== undefined) {
            info.push(formatTableIndexItem(key, value));
        }
    });

    return info;
}

type VectorSettings = TVectorIndexKmeansTreeDescriptionSettings;

export function buildVectorIndexInfo(vectorSettings?: VectorSettings): InfoViewerItem[] {
    const info: InfoViewerItem[] = [];
    if (!vectorSettings) {
        return info;
    }

    const vectorFormatter = createInfoFormatter<Pick<VectorSettings, 'clusters' | 'levels'>>({
        values: {
            clusters: (v) => (typeof v === 'number' ? formatNumber(v) : v),
            levels: (v) => (typeof v === 'number' ? formatNumber(v) : v),
        },
        labels: {
            clusters: i18n('field_clusters'),
            levels: i18n('field_levels'),
        },
    });

    const settingsFormatter = createInfoFormatter<TVectorIndexKmeansTreeDescriptionSettingsInner>({
        values: {
            vector_dimension: (v) => (typeof v === 'number' ? formatNumber(v) : v),
        },
        labels: {
            vector_dimension: i18n('field_vector-dimension'),
            vector_type: i18n('field_vector-type'),
            metric: i18n('field_metric'),
        },
    });

    const {clusters, levels, settings} = vectorSettings ?? {};
    if (clusters !== undefined) {
        info.push(vectorFormatter('clusters', clusters));
    }
    if (levels !== undefined) {
        info.push(vectorFormatter('levels', levels));
    }

    const {vector_dimension: vectorDimension, vector_type: vectorType, metric} = settings ?? {};

    if (vectorDimension !== undefined) {
        info.push(settingsFormatter('vector_dimension', vectorDimension));
    }
    if (vectorType !== undefined) {
        info.push(settingsFormatter('vector_type', vectorType));
    }
    if (metric !== undefined) {
        info.push(settingsFormatter('metric', metric));
    }

    return info;
}
