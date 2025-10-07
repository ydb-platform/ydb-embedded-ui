import type {TIndexDescription} from '../../../types/api/schema';
import type {
    TFulltextIndexAnalyzers,
    TFulltextIndexSettings,
    TKMeansTreeSettings,
    TVectorIndexSettings,
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

/* eslint-disable camelcase */

export function buildVectorIndexSettingsInfo(
    kMeansTreeSettings?: TKMeansTreeSettings,
): InfoViewerItem[] {
    const info: InfoViewerItem[] = [];
    if (!kMeansTreeSettings) {
        return info;
    }

    const kMeansTreeSettingsFormatter = createInfoFormatter<
        Pick<TKMeansTreeSettings, 'clusters' | 'levels'>
    >({
        values: {
            clusters: (v) => (typeof v === 'number' ? formatNumber(v) : v),
            levels: (v) => (typeof v === 'number' ? formatNumber(v) : v),
        },
        labels: {
            clusters: i18n('field_clusters'),
            levels: i18n('field_levels'),
        },
    });

    const {clusters, levels, settings} = kMeansTreeSettings;
    if (clusters !== undefined) {
        info.push(kMeansTreeSettingsFormatter('clusters', clusters));
    }
    if (levels !== undefined) {
        info.push(kMeansTreeSettingsFormatter('levels', levels));
    }

    const vectorIndexSettingsFormatter = createInfoFormatter<TVectorIndexSettings>({
        values: {
            vector_dimension: (v) => (typeof v === 'number' ? formatNumber(v) : v),
            vector_type: (v) => (typeof v === 'string' ? v.replace(/^VECTOR_TYPE_/, '') : v),
        },
        labels: {
            vector_dimension: i18n('field_vector_dimension'),
            vector_type: i18n('field_vector_type'),
            metric: i18n('field_metric'),
        },
    });

    const {metric, vector_type, vector_dimension} = settings ?? {};
    if (metric !== undefined) {
        info.push(vectorIndexSettingsFormatter('metric', metric));
    }
    if (vector_type !== undefined) {
        info.push(vectorIndexSettingsFormatter('vector_type', vector_type));
    }
    if (vector_dimension !== undefined) {
        info.push(vectorIndexSettingsFormatter('vector_dimension', vector_dimension));
    }

    return info;
}

export function buildFulltextIndexSettingsInfo(
    fulltextSettings?: TFulltextIndexSettings,
): InfoViewerItem[] {
    const info: InfoViewerItem[] = [];
    if (!fulltextSettings) {
        return info;
    }

    const fulltextFormatter = createInfoFormatter<Pick<TFulltextIndexSettings, 'layout'>>({
        values: {
            layout: (v) => v,
        },
        labels: {
            layout: i18n('field_layout'),
        },
    });

    const {layout} = fulltextSettings;
    if (layout !== undefined) {
        info.push(fulltextFormatter('layout', layout));
    }

    const fulltextIndexAnalyzersFormatter = createInfoFormatter<TFulltextIndexAnalyzers>({
        values: {
            tokenizer: (v) => v,
            language: (v) => v,
            use_filter_lowercase: (v) =>
                v === true ? i18n('filter_enabled') : i18n('filter_disabled'),
            use_filter_stopwords: (v) =>
                v === true ? i18n('filter_enabled') : i18n('filter_disabled'),
            use_filter_ngram: (v) =>
                v === true ? i18n('filter_enabled') : i18n('filter_disabled'),
            use_filter_edge_ngram: (v) =>
                v === true ? i18n('filter_enabled') : i18n('filter_disabled'),
            filter_ngram_min_length: (v) => (typeof v === 'number' ? formatNumber(v) : v),
            filter_ngram_max_length: (v) => (typeof v === 'number' ? formatNumber(v) : v),
            use_filter_length: (v) =>
                v === true ? i18n('filter_enabled') : i18n('filter_disabled'),
            filter_length_min: (v) => (typeof v === 'number' ? formatNumber(v) : v),
            filter_length_max: (v) => (typeof v === 'number' ? formatNumber(v) : v),
        },
        labels: {
            tokenizer: i18n('field_tokenizer'),
            language: i18n('field_language'),
            use_filter_lowercase: i18n('field_use_filter_lowercase'),
            use_filter_stopwords: i18n('field_use_filter_stopwords'),
            use_filter_ngram: i18n('field_use_filter_ngram'),
            use_filter_edge_ngram: i18n('field_use_filter_edge_ngram'),
            filter_ngram_min_length: i18n('field_filter_ngram_min_length'),
            filter_ngram_max_length: i18n('field_filter_ngram_max_length'),
            use_filter_length: i18n('field_use_filter_length'),
            filter_length_min: i18n('field_filter_length_min'),
            filter_length_max: i18n('field_filter_length_max'),
        },
    });

    const {
        tokenizer,
        language,
        use_filter_lowercase,
        use_filter_stopwords,
        use_filter_ngram,
        use_filter_edge_ngram,
        filter_ngram_min_length,
        filter_ngram_max_length,
        use_filter_length,
        filter_length_min,
        filter_length_max,
    } = fulltextSettings.columns?.at(0)?.analyzers ?? {};
    if (tokenizer !== undefined) {
        info.push(fulltextIndexAnalyzersFormatter('tokenizer', tokenizer));
    }
    if (language !== undefined) {
        info.push(fulltextIndexAnalyzersFormatter('language', language));
    }
    if (use_filter_lowercase !== undefined) {
        info.push(fulltextIndexAnalyzersFormatter('use_filter_lowercase', use_filter_lowercase));
    }
    if (use_filter_stopwords !== undefined) {
        info.push(fulltextIndexAnalyzersFormatter('use_filter_stopwords', use_filter_stopwords));
    }
    if (use_filter_ngram !== undefined) {
        info.push(fulltextIndexAnalyzersFormatter('use_filter_ngram', use_filter_ngram));
    }
    if (use_filter_edge_ngram !== undefined) {
        info.push(fulltextIndexAnalyzersFormatter('use_filter_edge_ngram', use_filter_edge_ngram));
    }
    if (filter_ngram_min_length !== undefined) {
        info.push(
            fulltextIndexAnalyzersFormatter('filter_ngram_min_length', filter_ngram_min_length),
        );
    }
    if (filter_ngram_max_length !== undefined) {
        info.push(
            fulltextIndexAnalyzersFormatter('filter_ngram_max_length', filter_ngram_max_length),
        );
    }
    if (use_filter_length !== undefined) {
        info.push(fulltextIndexAnalyzersFormatter('use_filter_length', use_filter_length));
    }
    if (filter_length_min !== undefined) {
        info.push(fulltextIndexAnalyzersFormatter('filter_length_min', filter_length_min));
    }
    if (filter_length_max !== undefined) {
        info.push(fulltextIndexAnalyzersFormatter('filter_length_max', filter_length_max));
    }

    return info;
}

/* eslint-enable camelcase */
