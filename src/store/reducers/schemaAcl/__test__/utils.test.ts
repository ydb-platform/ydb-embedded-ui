import type {TACE} from '../../../../types/api/acl';
import {
    getSubjectExplicitAces,
    prepareAccessRightsUpdateRequest,
    prepareRevokeAllRightsRequest,
} from '../utils';

describe('prepareAccessRightsUpdateRequest', () => {
    test('creates a separate ACE for every granted right and subject', () => {
        expect(
            prepareAccessRightsUpdateRequest({
                subjects: ['alice', 'bob'],
                rightsToGrant: ['select_row', 'update_row'],
                rightsToRevoke: [],
                subjectExplicitAces: [],
                supportsNonDefaultInheritanceRevocation: false,
            }),
        ).toEqual({
            AddAccess: [
                {
                    Subject: 'alice',
                    AccessType: 'Allow',
                    AccessRights: ['select_row'],
                },
                {
                    Subject: 'alice',
                    AccessType: 'Allow',
                    AccessRights: ['update_row'],
                },
                {
                    Subject: 'bob',
                    AccessType: 'Allow',
                    AccessRights: ['select_row'],
                },
                {
                    Subject: 'bob',
                    AccessType: 'Allow',
                    AccessRights: ['update_row'],
                },
            ],
        });
    });

    test('replaces a grouped ACE with separate ACEs for the rights that remain', () => {
        const groupedAce: TACE = {
            Subject: 'alice',
            AccessType: 'Allow',
            AccessRights: ['select_row', 'update_row'],
            InheritanceType: ['inherit'],
        };

        expect(
            prepareAccessRightsUpdateRequest({
                subjects: ['alice'],
                rightsToGrant: [],
                rightsToRevoke: ['select_row'],
                subjectExplicitAces: [groupedAce],
                supportsNonDefaultInheritanceRevocation: true,
            }),
        ).toEqual({
            AddAccess: [
                {
                    Subject: 'alice',
                    AccessType: 'Allow',
                    AccessRights: ['update_row'],
                    InheritanceType: ['inherit'],
                },
            ],
            RemoveAccess: [groupedAce],
        });
    });

    test('replaces a grouped default-inheritance ACE when exact non-default revocation is unavailable', () => {
        const groupedAce: TACE = {
            Subject: 'alice',
            AccessType: 'Allow',
            AccessRights: ['select_row', 'update_row'],
            InheritanceType: ['inherit'],
        };

        expect(
            prepareAccessRightsUpdateRequest({
                subjects: ['alice'],
                rightsToGrant: [],
                rightsToRevoke: ['select_row'],
                subjectExplicitAces: [groupedAce],
                supportsNonDefaultInheritanceRevocation: false,
            }),
        ).toEqual({
            AddAccess: [
                {
                    Subject: 'alice',
                    AccessType: 'Allow',
                    AccessRights: ['update_row'],
                    InheritanceType: ['inherit'],
                },
            ],
            RemoveAccess: [groupedAce],
        });
    });

    test('treats object and container as default inheritance regardless of case', () => {
        const groupedAce: TACE = {
            Subject: 'alice',
            AccessType: 'Allow',
            AccessRights: ['select_row', 'update_row'],
            InheritanceType: ['OBJECT', 'CONTAINER'],
        };

        expect(
            prepareAccessRightsUpdateRequest({
                subjects: ['alice'],
                rightsToGrant: [],
                rightsToRevoke: ['select_row'],
                subjectExplicitAces: [groupedAce],
                supportsNonDefaultInheritanceRevocation: false,
            }),
        ).toEqual({
            AddAccess: [
                {
                    Subject: 'alice',
                    AccessType: 'Allow',
                    AccessRights: ['update_row'],
                    InheritanceType: ['OBJECT', 'CONTAINER'],
                },
            ],
            RemoveAccess: [groupedAce],
        });
    });

    test('uses legacy revoke without restoring ACE remainder when exact revocation is unavailable', () => {
        expect(
            prepareAccessRightsUpdateRequest({
                subjects: ['alice'],
                rightsToGrant: [],
                rightsToRevoke: ['select_row'],
                subjectExplicitAces: [
                    {
                        Subject: 'alice',
                        AccessType: 'Allow',
                        AccessRights: ['select_row', 'update_row'],
                        InheritanceType: ['none'],
                    },
                ],
                supportsNonDefaultInheritanceRevocation: false,
            }),
        ).toEqual({
            RemoveAccess: [
                {
                    Subject: 'alice',
                    AccessType: 'Allow',
                    AccessRights: ['select_row'],
                },
            ],
        });
    });

    test('uses exact revoke for default ACEs and legacy revoke for non-default ACEs in one request', () => {
        const defaultAce: TACE = {
            Subject: 'alice',
            AccessType: 'Allow',
            AccessRights: ['select_row', 'update_row'],
            InheritanceType: ['inherit'],
        };

        expect(
            prepareAccessRightsUpdateRequest({
                subjects: ['alice'],
                rightsToGrant: [],
                rightsToRevoke: ['select_row'],
                subjectExplicitAces: [
                    defaultAce,
                    {
                        Subject: 'alice',
                        AccessType: 'Allow',
                        AccessRights: ['select_row', 'erase_row'],
                        InheritanceType: ['none'],
                    },
                ],
                supportsNonDefaultInheritanceRevocation: false,
            }),
        ).toEqual({
            AddAccess: [
                {
                    Subject: 'alice',
                    AccessType: 'Allow',
                    AccessRights: ['update_row'],
                    InheritanceType: ['inherit'],
                },
            ],
            RemoveAccess: [
                defaultAce,
                {
                    Subject: 'alice',
                    AccessType: 'Allow',
                    AccessRights: ['select_row'],
                },
            ],
        });
    });

    test('removes every ACE containing the revoked right and preserves each remainder', () => {
        const subjectExplicitAces: TACE[] = [
            {
                Subject: 'alice',
                AccessType: 'Allow',
                AccessRights: ['select_row', 'update_row'],
            },
            {
                Subject: 'alice',
                AccessType: 'Deny',
                AccessRules: ['select_row'],
                InheritanceType: ['none'],
            },
        ];

        expect(
            prepareAccessRightsUpdateRequest({
                subjects: ['alice'],
                rightsToGrant: [],
                rightsToRevoke: ['select_row'],
                subjectExplicitAces,
                supportsNonDefaultInheritanceRevocation: true,
            }),
        ).toEqual({
            AddAccess: [
                {
                    Subject: 'alice',
                    AccessType: 'Allow',
                    AccessRights: ['update_row'],
                },
            ],
            RemoveAccess: [
                {
                    Subject: 'alice',
                    AccessType: 'Allow',
                    AccessRights: ['select_row', 'update_row'],
                },
                {
                    Subject: 'alice',
                    AccessType: 'Deny',
                    AccessRights: ['select_row'],
                    InheritanceType: ['none'],
                },
            ],
        });
    });

    test('serializes mixed rule and granular rights and restores a Deny remainder', () => {
        expect(
            prepareAccessRightsUpdateRequest({
                subjects: ['alice'],
                rightsToGrant: [],
                rightsToRevoke: ['select'],
                subjectExplicitAces: [
                    {
                        Subject: 'alice',
                        AccessType: 'Deny',
                        AccessRules: ['select'],
                        AccessRights: ['grant'],
                        InheritanceType: ['none'],
                    },
                ],
                supportsNonDefaultInheritanceRevocation: true,
            }),
        ).toEqual({
            AddAccess: [
                {
                    Subject: 'alice',
                    AccessType: 'Deny',
                    AccessRights: ['grant'],
                    InheritanceType: ['none'],
                },
            ],
            RemoveAccess: [
                {
                    Subject: 'alice',
                    AccessType: 'Deny',
                    AccessRights: ['select', 'grant'],
                    InheritanceType: ['none'],
                },
            ],
        });
    });

    test('omits empty access update arrays', () => {
        expect(
            prepareAccessRightsUpdateRequest({
                subjects: [],
                rightsToGrant: [],
                rightsToRevoke: [],
                subjectExplicitAces: [],
                supportsNonDefaultInheritanceRevocation: false,
            }),
        ).toEqual({});
    });
});

describe('prepareRevokeAllRightsRequest', () => {
    test('removes every original ACE without merging their rights', () => {
        const subjectExplicitAces: TACE[] = [
            {
                Subject: 'alice',
                AccessType: 'Allow',
                AccessRights: ['select_row', 'update_row'],
                InheritanceType: ['inherit'],
            },
            {
                Subject: 'alice',
                AccessType: 'Deny',
                AccessRules: ['full'],
                InheritanceType: ['none'],
            },
        ];

        expect(prepareRevokeAllRightsRequest(subjectExplicitAces)).toEqual({
            RemoveAccess: [
                {
                    Subject: 'alice',
                    AccessType: 'Allow',
                    AccessRights: ['select_row', 'update_row'],
                    InheritanceType: ['inherit'],
                },
                {
                    Subject: 'alice',
                    AccessType: 'Deny',
                    AccessRights: ['full'],
                    InheritanceType: ['none'],
                },
            ],
        });
    });

    test('omits RemoveAccess when the subject has no ACEs', () => {
        expect(prepareRevokeAllRightsRequest([])).toEqual({});
    });
});

describe('getSubjectExplicitAces', () => {
    test('keeps the original ACE boundaries for the selected subject', () => {
        const aliceAces: TACE[] = [
            {
                Subject: 'alice',
                AccessType: 'Allow',
                AccessRights: ['select_row', 'update_row'],
            },
            {
                Subject: 'alice',
                AccessType: 'Allow',
                AccessRights: ['erase_row'],
            },
        ];
        const bobAce: TACE = {
            Subject: 'bob',
            AccessType: 'Allow',
            AccessRights: ['select_row'],
        };

        expect(getSubjectExplicitAces([...aliceAces, bobAce], 'alice')).toEqual(aliceAces);
    });

    test('returns no ACEs when ACL data or subject is absent', () => {
        expect(getSubjectExplicitAces(undefined, 'alice')).toEqual([]);
        expect(getSubjectExplicitAces([], undefined)).toEqual([]);
    });
});
