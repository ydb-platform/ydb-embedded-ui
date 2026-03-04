import {buildVectorIndexSettingsInfo} from '../utils';

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
