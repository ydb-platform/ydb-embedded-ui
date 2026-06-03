import {UNBREAKABLE_GAP} from '../../../../utils/constants';
import {formatRetentionPeriodSelectValue, formatWriteQuotaSelectValue} from '../utils';

describe('TopicFormDialog utils', () => {
    test('formats whole megabytes per second as MB/s', () => {
        expect(formatWriteQuotaSelectValue(2 * 1024 * 1024)).toBe(`2${UNBREAKABLE_GAP}MB/s`);
    });

    test('formats write quota values as whole MB/s, whole KB/s, or raw bytes', () => {
        expect(formatWriteQuotaSelectValue(512 * 1024)).toBe(`512${UNBREAKABLE_GAP}KB/s`);
        expect(formatWriteQuotaSelectValue(10 * 1024 * 1024)).toBe(`10${UNBREAKABLE_GAP}MB/s`);
        expect(formatWriteQuotaSelectValue(1536)).toBe(`1536${UNBREAKABLE_GAP}byte/s`);
        expect(formatWriteQuotaSelectValue(10000)).toBe(`10000${UNBREAKABLE_GAP}byte/s`);
    });

    test('formats retention values using day hour minute and second units', () => {
        expect(formatRetentionPeriodSelectValue(2 * 24 * 60 * 60)).toBe('2 days');
        expect(formatRetentionPeriodSelectValue(12 * 60 * 60)).toBe('12 hours');
        expect(formatRetentionPeriodSelectValue(18 * 60 * 60)).toBe('18 hours');
        expect(formatRetentionPeriodSelectValue(90 * 60)).toBe('90 minutes');
        expect(formatRetentionPeriodSelectValue(45)).toBe('45 seconds');
        expect(formatRetentionPeriodSelectValue(1)).toBe('1 second');
        expect(formatRetentionPeriodSelectValue(60)).toBe('1 minute');
        expect(formatRetentionPeriodSelectValue(24 * 60 * 60)).toBe('1 day');
    });
});
