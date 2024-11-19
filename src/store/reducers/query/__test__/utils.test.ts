import {getActionAndSyntaxFromQueryMode} from '../utils';

describe('getActionAndSyntaxFromQueryMode', () => {
    it('Correctly prepares execute action', () => {
        const {action, syntax} = getActionAndSyntaxFromQueryMode('execute', 'script');
        expect(action).toBe('execute-script');
        expect(syntax).toBe('yql_v1');
    });
    it('Correctly prepares execute action with pg syntax', () => {
        const {action, syntax} = getActionAndSyntaxFromQueryMode('execute', 'pg');
        expect(action).toBe('execute-query');
        expect(syntax).toBe('pg');
    });
    it('Correctly prepares explain action', () => {
        const {action, syntax} = getActionAndSyntaxFromQueryMode('explain', 'script');
        expect(action).toBe('explain-script');
        expect(syntax).toBe('yql_v1');
    });
    it('Correctly prepares explain action with pg syntax', () => {
        const {action, syntax} = getActionAndSyntaxFromQueryMode('explain', 'pg');
        expect(action).toBe('explain-query');
        expect(syntax).toBe('pg');
    });
});
