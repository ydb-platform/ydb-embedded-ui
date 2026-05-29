import {getLeavesFromTree} from '../../../../store/reducers/healthcheckInfo/utils';
import type {IssueLog} from '../../../../types/api/healthcheck';
import {configureUIFactory} from '../../../../uiFactory/uiFactory';
import {
    getHealthcheckViewsOrder,
    getHealthckechViewTitles,
    isIssueTypeOfCategory,
    issueCategories,
} from '../shared';
import {countHealthcheckIssuesByCategory} from '../utils';

function resetHealthcheckFactory() {
    configureUIFactory({
        healthcheck: {
            issueCategories,
            isIssueTypeOfCategory,
            getHealthckechViewTitles,
            getHealthcheckViewsOrder,
        },
    });
}

describe('healthcheck issue categories', () => {
    afterEach(() => {
        resetHealthcheckFactory();
    });

    test('classifies healthcheck leaves by direct child category', () => {
        const issues: IssueLog[] = [
            {id: 'database', type: 'DATABASE', reason: ['storage', 'compute', 'unknown']},
            {id: 'storage', type: 'STORAGE', reason: ['pdisk']},
            {id: 'pdisk', type: 'PDISK', message: 'PDisk issue'},
            {id: 'compute', type: 'COMPUTE', message: 'Compute issue'},
            {id: 'unknown', type: 'DATABASE', message: 'Database issue'},
        ];

        const leaves = getLeavesFromTree(issues, issues[0]);

        expect(leaves).toEqual(
            expect.arrayContaining([
                expect.objectContaining({id: 'pdisk', categoryForUI: 'storage'}),
                expect.objectContaining({id: 'compute', categoryForUI: 'compute'}),
                expect.objectContaining({id: 'unknown', categoryForUI: 'unknown'}),
            ]),
        );
    });

    test('counts default storage, compute, and unknown categories', () => {
        const issues: IssueLog[] = [
            {id: 'storage', type: 'STORAGE'},
            {id: 'compute', type: 'COMPUTE'},
            {id: 'database', type: 'DATABASE'},
        ];
        const leaves = issues.flatMap((issue) => getLeavesFromTree(issues, issue));

        expect(countHealthcheckIssuesByCategory(leaves)).toEqual({
            storage: 1,
            compute: 1,
            unknown: 1,
        });
    });

    test('uses configured custom categories for classification and counting', () => {
        configureUIFactory<'network' | 'storage'>({
            healthcheck: {
                issueCategories: ['network', 'storage'],
                isIssueTypeOfCategory: (type, category) => {
                    if (category === 'network') {
                        return type.startsWith('NETWORK');
                    }

                    return isIssueTypeOfCategory(type, category);
                },
                getHealthcheckViewsOrder: () => ['storage', 'network'],
            },
        });

        const issues: IssueLog[] = [
            {id: 'network', type: 'NETWORK_PEER'},
            {id: 'storage', type: 'VDISK'},
            {id: 'compute', type: 'COMPUTE'},
        ];
        const leaves = issues.flatMap((issue) => getLeavesFromTree(issues, issue));

        expect(leaves).toEqual(
            expect.arrayContaining([
                expect.objectContaining({id: 'network', categoryForUI: 'network'}),
                expect.objectContaining({id: 'storage', categoryForUI: 'storage'}),
                expect.objectContaining({id: 'compute', categoryForUI: 'unknown'}),
            ]),
        );
        expect(countHealthcheckIssuesByCategory<'network' | 'storage'>(leaves)).toEqual({
            network: 1,
            storage: 1,
            unknown: 1,
        });
    });

    test('counts categories that are present on issues but absent from the current factory config', () => {
        configureUIFactory<'storage'>({
            healthcheck: {
                issueCategories: ['storage'],
                isIssueTypeOfCategory: (type) => type.startsWith('STORAGE'),
                getHealthcheckViewsOrder: () => ['storage'],
            },
        });

        const count = countHealthcheckIssuesByCategory([
            {id: 'compute', type: 'COMPUTE', categoryForUI: 'compute'},
        ]);

        expect(count).toMatchObject({
            storage: 0,
            unknown: 0,
            compute: 1,
        });
    });
});
