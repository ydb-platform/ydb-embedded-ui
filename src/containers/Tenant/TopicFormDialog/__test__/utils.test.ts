import {UNBREAKABLE_GAP} from '../../../../utils/constants';
import {formatWriteQuotaSelectValue} from '../utils';

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
});
