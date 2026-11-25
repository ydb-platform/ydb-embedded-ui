import type {TACE} from '../../types/api/acl';
import {prepareAccessRights} from '../prepareAccessRights';

describe('prepareAccessRights', () => {
    test('groups both rights formats by subject and deduplicates each column', () => {
        const acl: TACE[] = [
            {
                Subject: 'alice',
                AccessType: 'Allow',
                AccessRules: ['select'],
                AccessRights: ['select', 'update'],
            },
            {Subject: 'bob', AccessType: 'Allow', AccessRights: ['describe_schema']},
            {Subject: 'alice', AccessType: 'Deny', AccessRules: ['update', 'erase']},
        ];
        const effectiveAcl: TACE[] = [
            {
                Subject: 'alice',
                AccessType: 'Allow',
                AccessRules: ['select'],
                AccessRights: ['select', 'read_attributes'],
            },
            {Subject: 'inherited', AccessType: 'Allow', AccessRules: ['select']},
        ];

        expect(prepareAccessRights(acl, effectiveAcl)).toEqual([
            {
                subject: 'alice',
                explicit: ['select', 'update', 'erase'],
                effective: ['select', 'read_attributes'],
            },
            {subject: 'bob', explicit: ['describe_schema'], effective: []},
            {subject: 'inherited', explicit: [], effective: ['select']},
        ]);
    });

    test('handles missing lists, empty subjects and subjects without rights', () => {
        expect(prepareAccessRights()).toEqual([]);
        expect(prepareAccessRights([], [])).toEqual([]);
        expect(
            prepareAccessRights([
                {Subject: '', AccessType: 'Allow', AccessRights: ['select']},
                {Subject: 'empty', AccessType: 'Allow'},
            ]),
        ).toEqual([{subject: 'empty', explicit: [], effective: []}]);
        expect(
            prepareAccessRights(undefined, [
                {Subject: 'inherited', AccessType: 'Allow', AccessRights: ['select']},
            ]),
        ).toEqual([{subject: 'inherited', explicit: [], effective: ['select']}]);
    });

    test('supports subjects matching object prototype property names', () => {
        const subjects = ['__proto__', 'constructor', 'toString'];
        expect(
            prepareAccessRights(
                subjects.map((Subject) => ({
                    Subject,
                    AccessType: 'Allow',
                    AccessRules: ['select'],
                })),
            ),
        ).toEqual(subjects.map((subject) => ({subject, explicit: ['select'], effective: []})));
    });

    test('preserves the existing ordering of numeric subject names', () => {
        const acl = ['alice', '10', '2', 'bob'].map((Subject) => ({Subject, AccessType: 'Allow'}));
        expect(prepareAccessRights(acl).map(({subject}) => subject)).toEqual([
            '2',
            '10',
            'alice',
            'bob',
        ]);
    });

    test('does not mutate inputs or share output arrays across calls', () => {
        const entry = {Subject: 'alice', AccessType: 'Allow', AccessRules: ['select']};
        Object.freeze(entry.AccessRules);
        Object.freeze(entry);
        const acl = Object.freeze([entry]);

        const result = prepareAccessRights(acl, acl);
        result[0].explicit.push('update');

        expect(entry.AccessRules).toEqual(['select']);
        expect(result[0].effective).toEqual(['select']);
        expect(prepareAccessRights(acl, acl)[0].explicit).toEqual(['select']);
    });
});
