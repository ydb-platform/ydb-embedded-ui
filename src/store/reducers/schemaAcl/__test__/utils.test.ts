import type {TACE} from '../../../../types/api/acl';
import {
    getSubjectExplicitAllowAces,
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

    test('does not revoke a Deny ACE through the grant flow', () => {
        expect(
            prepareAccessRightsUpdateRequest({
                subjects: ['alice'],
                rightsToGrant: [],
                rightsToRevoke: ['select_row'],
                subjectExplicitAces: [
                    {
                        Subject: 'alice',
                        AccessType: 'Deny',
                        AccessRights: ['select_row', 'update_row'],
                        InheritanceType: ['none'],
                    },
                ],
                supportsNonDefaultInheritanceRevocation: false,
            }),
        ).toEqual({});
    });

    test('revokes a legacy Allow ACE without touching a Deny ACE', () => {
        expect(
            prepareAccessRightsUpdateRequest({
                subjects: ['alice'],
                rightsToGrant: [],
                rightsToRevoke: ['select_row', 'update_row'],
                subjectExplicitAces: [
                    {
                        Subject: 'alice',
                        AccessType: 'Allow',
                        AccessRights: ['select_row'],
                        InheritanceType: ['none'],
                    },
                    {
                        Subject: 'alice',
                        AccessType: 'Deny',
                        AccessRights: ['update_row'],
                        InheritanceType: ['only'],
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

    test('updates matching Allow ACEs without touching a Deny ACE', () => {
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
            ],
        });
    });

    test('does not revoke a Deny ACE when exact inheritance revocation is supported', () => {
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
        ).toEqual({});
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
    test('removes every Allow ACE without touching Deny ACEs', () => {
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

        expect(prepareRevokeAllRightsRequest(subjectExplicitAces, true)).toEqual({
            RemoveAccess: [
                {
                    Subject: 'alice',
                    AccessType: 'Allow',
                    AccessRights: ['select_row', 'update_row'],
                    InheritanceType: ['inherit'],
                },
            ],
        });
    });

    test('uses exact default revoke and legacy non-default revoke together on ACL v2', () => {
        expect(
            prepareRevokeAllRightsRequest(
                [
                    {
                        Subject: 'alice',
                        AccessType: 'Allow',
                        AccessRights: ['select_row', 'update_row'],
                        InheritanceType: ['inherit'],
                    },
                    {
                        Subject: 'alice',
                        AccessType: 'Allow',
                        AccessRights: ['erase_row'],
                        InheritanceType: ['none'],
                    },
                    {
                        Subject: 'alice',
                        AccessType: 'Deny',
                        AccessRules: ['full'],
                        InheritanceType: ['none'],
                    },
                ],
                false,
            ),
        ).toEqual({
            RemoveAccess: [
                {
                    Subject: 'alice',
                    AccessType: 'Allow',
                    AccessRights: ['select_row', 'update_row'],
                    InheritanceType: ['inherit'],
                },
                {
                    Subject: 'alice',
                    AccessType: 'Allow',
                    AccessRights: ['erase_row'],
                },
            ],
        });
    });

    test('omits RemoveAccess when the subject has no ACEs', () => {
        expect(prepareRevokeAllRightsRequest([], false)).toEqual({});
    });
});

describe('getSubjectExplicitAllowAces', () => {
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

        expect(getSubjectExplicitAllowAces([...aliceAces, bobAce], 'alice')).toEqual(aliceAces);
    });

    test('does not expose Deny ACEs to the grant and revoke flows', () => {
        const allowAce: TACE = {
            Subject: 'alice',
            AccessType: 'Allow',
            AccessRights: ['select_row'],
        };
        const denyAce: TACE = {
            Subject: 'alice',
            AccessType: 'Deny',
            AccessRights: ['select_row'],
        };

        expect(getSubjectExplicitAllowAces([allowAce, denyAce], 'alice')).toEqual([allowAce]);
    });

    test('returns no ACEs when ACL data or subject is absent', () => {
        expect(getSubjectExplicitAllowAces(undefined, 'alice')).toEqual([]);
        expect(getSubjectExplicitAllowAces([], undefined)).toEqual([]);
    });
});
