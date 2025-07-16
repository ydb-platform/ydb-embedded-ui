import i18n from '../i18n';

describe('Cluster i18n greeting functionality', () => {
    it('should provide English greeting', () => {
        // Test English greeting
        const englishGreeting = i18n('greeting');
        expect(englishGreeting).toBe('Hello');
    });

    it('should have all required translations', () => {
        // Test that key exists
        expect(i18n('greeting')).toBeDefined();
        expect(i18n('label_overview')).toBeDefined();
    });
});
