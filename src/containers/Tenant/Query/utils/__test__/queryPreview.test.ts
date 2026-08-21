import {getQueryPreviewText} from '../queryPreview';

test('limits query preview by lines and characters', () => {
    expect(getQueryPreviewText('SELECT 1;\nSELECT 2;\nSELECT 3;\nSELECT 4;')).toBe(
        'SELECT 1;\nSELECT 2;\nSELECT 3;',
    );

    const singleLineQuery = 'x'.repeat(3000);
    expect(getQueryPreviewText(singleLineQuery)).toBe('x'.repeat(2000));
});
