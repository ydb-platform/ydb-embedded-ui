import type {IssueLog} from '../../../../types/api/healthcheck';
import {linkStateStorageSummaries} from '../utils';

function getStateStoragePileLocation(pileName: string) {
    return {
        compute: {
            state_storage: {
                pile: {name: pileName},
            },
        },
    };
}

describe('linkStateStorageSummaries', () => {
    test.each([
        ['PILE_STATE_STORAGE', 'STATE_STORAGE_RING'],
        ['PILE_SCHEME_BOARD', 'SCHEME_BOARD_RING'],
        ['PILE_BOARD', 'BOARD_RING'],
    ])('links %s only to %s issues from the same pile', (summaryType, ringType) => {
        const issues: IssueLog[] = [
            {
                id: 'himki-summary',
                type: summaryType,
                location: getStateStoragePileLocation('himki'),
            },
            {
                id: 'moscow-summary',
                type: summaryType,
                location: getStateStoragePileLocation('moscow'),
            },
            {
                id: 'himki-ring',
                type: ringType,
                location: getStateStoragePileLocation('himki'),
            },
            {
                id: 'moscow-ring',
                type: ringType,
                location: getStateStoragePileLocation('moscow'),
            },
            {
                id: 'unscoped-ring',
                type: ringType,
            },
        ];

        const linkedIssues = linkStateStorageSummaries(issues);

        expect(
            linkedIssues.slice(0, 2).map(({id, reason}) => ({
                id,
                reason,
            })),
        ).toEqual([
            {id: 'himki-summary', reason: ['himki-ring']},
            {id: 'moscow-summary', reason: ['moscow-ring']},
        ]);
    });
});
