import {buildFulltextIndexSettingsInfo, buildVectorIndexSettingsInfo} from '../utils';

describe('buildVectorIndexSettingsInfo', () => {
    test('returns empty array for undefined input', () => {
        expect(buildVectorIndexSettingsInfo(undefined)).toEqual([]);
    });

    test('returns empty array for empty object', () => {
        expect(buildVectorIndexSettingsInfo({})).toEqual([]);
    });

    test('displays clusters and levels without overlap_clusters', () => {
        const result = buildVectorIndexSettingsInfo({clusters: 128, levels: 2});

        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({label: 'Clusters', value: '128'});
        expect(result[1]).toEqual({label: 'Levels', value: '2'});
    });

    test('displays overlap_clusters between clusters and levels', () => {
        const result = buildVectorIndexSettingsInfo({
            clusters: 128,
            levels: 2,
            overlap_clusters: 3,
        });

        expect(result).toHaveLength(3);
        expect(result[0]).toEqual({label: 'Clusters', value: '128'});
        expect(result[1]).toEqual({label: 'Overlap Clusters', value: '3'});
        expect(result[2]).toEqual({label: 'Levels', value: '2'});
    });

    test('displays all settings including vector index settings', () => {
        const result = buildVectorIndexSettingsInfo({
            clusters: 64,
            levels: 3,
            overlap_clusters: 3,
            settings: {
                metric: 'cosine',
                vector_type: 'VECTOR_TYPE_FLOAT',
                vector_dimension: 512,
            },
        });

        expect(result).toHaveLength(6);
        expect(result[0]).toEqual({label: 'Clusters', value: '64'});
        expect(result[1]).toEqual({label: 'Overlap Clusters', value: '3'});
        expect(result[2]).toEqual({label: 'Levels', value: '3'});
        expect(result[3]).toEqual({label: 'Metric', value: 'cosine'});
        expect(result[4]).toEqual({label: 'Vector Type', value: 'FLOAT'});
        expect(result[5]).toEqual({label: 'Vector Dimension', value: '512'});
    });

    test('omits undefined fields gracefully', () => {
        const result = buildVectorIndexSettingsInfo({
            clusters: 128,
            overlap_clusters: 3,
            settings: {
                metric: 'cosine',
            },
        });

        expect(result).toHaveLength(3);
        expect(result[0]).toEqual({label: 'Clusters', value: '128'});
        expect(result[1]).toEqual({label: 'Overlap Clusters', value: '3'});
        expect(result[2]).toEqual({label: 'Metric', value: 'cosine'});
    });
});

describe('buildFulltextIndexSettingsInfo', () => {
    test('returns empty array for undefined input', () => {
        expect(buildFulltextIndexSettingsInfo(undefined)).toEqual([]);
    });

    test('returns empty array for empty object', () => {
        expect(buildFulltextIndexSettingsInfo({})).toEqual([]);
    });

    test('displays layout when provided', () => {
        const result = buildFulltextIndexSettingsInfo({layout: 'FLAT'});

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({label: 'Layout', value: 'FLAT'});
    });

    test('displays basic analyzer settings from columns', () => {
        const result = buildFulltextIndexSettingsInfo({
            columns: [
                {
                    column: 'text_column',
                    analyzers: {
                        tokenizer: 'standard',
                        language: 'english',
                    },
                },
            ],
        });

        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({label: 'Tokenizer', value: 'standard'});
        expect(result[1]).toEqual({label: 'Language', value: 'english'});
    });

    test('displays use_filter_snowball as Enabled when true', () => {
        const result = buildFulltextIndexSettingsInfo({
            columns: [
                {
                    column: 'text_column',
                    analyzers: {
                        use_filter_snowball: true,
                    },
                },
            ],
        });

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({label: 'Filter Snowball', value: 'Enabled'});
    });

    test('displays use_filter_snowball as Disabled when false', () => {
        const result = buildFulltextIndexSettingsInfo({
            columns: [
                {
                    column: 'text_column',
                    analyzers: {
                        use_filter_snowball: false,
                    },
                },
            ],
        });

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({label: 'Filter Snowball', value: 'Disabled'});
    });

    test('displays all settings including use_filter_snowball', () => {
        const result = buildFulltextIndexSettingsInfo({
            layout: 'FLAT_RELEVANCE',
            columns: [
                {
                    column: 'text_column',
                    analyzers: {
                        tokenizer: 'standard',
                        language: 'english',
                        use_filter_lowercase: true,
                        use_filter_stopwords: false,
                        use_filter_snowball: true,
                    },
                },
            ],
        });

        expect(result).toHaveLength(6);
        expect(result[0]).toEqual({label: 'Layout', value: 'FLAT_RELEVANCE'});
        expect(result[1]).toEqual({label: 'Tokenizer', value: 'standard'});
        expect(result[2]).toEqual({label: 'Language', value: 'english'});
        expect(result[3]).toEqual({label: 'Filter Lowercase', value: 'Enabled'});
        expect(result[4]).toEqual({label: 'Filter Stopwords', value: 'Disabled'});
        expect(result[5]).toEqual({label: 'Filter Snowball', value: 'Enabled'});
    });

    test('omits undefined analyzer fields gracefully', () => {
        const result = buildFulltextIndexSettingsInfo({
            layout: 'FLAT',
            columns: [
                {
                    column: 'text_column',
                    analyzers: {
                        tokenizer: 'whitespace',
                        use_filter_snowball: true,
                    },
                },
            ],
        });

        expect(result).toHaveLength(3);
        expect(result[0]).toEqual({label: 'Layout', value: 'FLAT'});
        expect(result[1]).toEqual({label: 'Tokenizer', value: 'whitespace'});
        expect(result[2]).toEqual({label: 'Filter Snowball', value: 'Enabled'});
    });

    test('returns empty array when columns have no analyzers', () => {
        const result = buildFulltextIndexSettingsInfo({
            columns: [
                {
                    column: 'text_column',
                },
            ],
        });

        expect(result).toEqual([]);
    });

    test('displays ngram filter settings with numeric values', () => {
        const result = buildFulltextIndexSettingsInfo({
            columns: [
                {
                    column: 'text_column',
                    analyzers: {
                        use_filter_ngram: true,
                        filter_ngram_min_length: 3,
                        filter_ngram_max_length: 4,
                    },
                },
            ],
        });

        expect(result).toHaveLength(3);
        expect(result[0]).toEqual({label: 'Filter Ngram', value: 'Enabled'});
        expect(result[1]).toEqual({label: 'Filter Ngram Min Length', value: '3'});
        expect(result[2]).toEqual({label: 'Filter Ngram Max Length', value: '4'});
    });
});
