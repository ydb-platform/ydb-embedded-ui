import MonacoEditor from 'react-monaco-editor';

import {cn} from '../../../../../../utils/cn';
import {S_EXPRESSION_LANGUAGE_ID} from '../../../../../../utils/monaco/constats';

import './Ast.scss';

const b = cn('ydb-query-explain-ast');

const EDITOR_OPTIONS = {
    automaticLayout: true,
    selectOnLineNumbers: true,
    readOnly: true,
    minimap: {
        enabled: false,
    },
    wrappingIndent: 'indent' as const,
};

interface AstProps {
    ast: string;
    theme: string;
}

export function Ast({ast, theme}: AstProps) {
    return (
        <div className={b()}>
            <MonacoEditor
                language={S_EXPRESSION_LANGUAGE_ID}
                value={ast}
                options={EDITOR_OPTIONS}
                theme={`vs-${theme}`}
            />
        </div>
    );
}
