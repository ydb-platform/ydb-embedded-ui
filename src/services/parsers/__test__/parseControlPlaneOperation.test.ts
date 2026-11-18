import {parseControlPlaneOperation} from '../parseControlPlaneOperation';

describe('parseControlPlaneOperation', () => {
    test('classifies failures and cancellations as Error while preserving the message', () => {
        expect(
            parseControlPlaneOperation({
                id: 'op',
                done: true,
                error: {code: 1, message: 'Cancelled by user'},
            }),
        ).toMatchObject({
            id: 'op',
            controlPlaneStatus: 'ERROR',
            issues: [{message: 'Cancelled by user'}],
        });
        expect(
            parseControlPlaneOperation({error: {code: 13, message: 'Disk unavailable'}}),
        ).toMatchObject({
            controlPlaneStatus: 'ERROR',
            issues: [{message: 'Disk unavailable'}],
        });
    });
    test('preserves creation and update times without inventing an end time', () => {
        const op = parseControlPlaneOperation({
            done: true,
            created_at: '2026-11-12T10:00:00Z',
            modified_at: '2026-11-12T11:00:00Z',
        });
        expect(op.controlPlaneStatus).toBe('DONE');
        expect(op.modified_at).toBe(Date.parse('2026-11-12T11:00:00Z'));
        expect(op.created_at).toBe(Date.parse('2026-11-12T10:00:00Z'));
        expect(op.end_time).toBeUndefined();
    });
    test('omitted proto boolean means in progress', () => {
        expect(parseControlPlaneOperation({})).toMatchObject({controlPlaneStatus: 'PENDING'});
    });
    test.each([undefined, '', 'invalid', {}, {seconds: 'invalid'}])(
        'missing or invalid timestamp %j stays absent',
        (createdAt) => {
            expect(parseControlPlaneOperation({created_at: createdAt}).created_at).toBeUndefined();
        },
    );
    test('accepts protobuf object timestamps, including epoch zero', () => {
        expect(
            parseControlPlaneOperation({created_at: {seconds: '0', nanos: 500000000}}).created_at,
        ).toBe(500);
    });
});
