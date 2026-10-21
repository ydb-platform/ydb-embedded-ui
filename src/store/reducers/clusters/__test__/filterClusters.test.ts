import {filterClusters} from '../selectors';
import type {ClustersFilters} from '../types';
import {prepareClustersData} from '../utils';

const defaultFilters: ClustersFilters = {
    clusterName: '',
    status: [],
    service: [],
    version: [],
    galaxy: [],
    availability: ['available'],
};
const clusters = prepareClustersData({
    clusters: [
        {name: 'available'},
        {name: 'explicitly-available', settings: {unavailable: false}},
        {name: 'unavailable-object', settings: {unavailable: true}},
        {name: 'unavailable-json', settings: '{"unavailable":true}'},
    ],
});

describe('filterClusters', () => {
    test('hides unavailable clusters by default for object and JSON settings', () => {
        expect(filterClusters(clusters, defaultFilters).map(({name}) => name)).toEqual([
            'available',
            'explicitly-available',
        ]);
    });

    test('shows all clusters when both availability states are selected', () => {
        expect(
            filterClusters(clusters, {
                ...defaultFilters,
                availability: ['available', 'unavailable'],
            }).map(({name}) => name),
        ).toEqual(['available', 'explicitly-available', 'unavailable-object', 'unavailable-json']);
    });

    test('keeps unavailable clusters hidden when they match the search', () => {
        expect(filterClusters(clusters, {...defaultFilters, clusterName: 'unavailable'})).toEqual(
            [],
        );
    });

    test('applies the search when only unavailable clusters are selected', () => {
        expect(
            filterClusters(clusters, {
                ...defaultFilters,
                availability: ['unavailable'],
                clusterName: 'json',
            }).map(({name}) => name),
        ).toEqual(['unavailable-json']);
    });

    test('shows only unavailable clusters for object and JSON settings', () => {
        expect(
            filterClusters(clusters, {...defaultFilters, availability: ['unavailable']}).map(
                ({name}) => name,
            ),
        ).toEqual(['unavailable-object', 'unavailable-json']);
    });

    test('shows no clusters when no availability states are selected', () => {
        expect(filterClusters(clusters, {...defaultFilters, availability: []})).toEqual([]);
    });
});
