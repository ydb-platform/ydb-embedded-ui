import MonacoEditor from 'react-monaco-editor';

import {cn} from '../../../../../../utils/cn';
import {LANGUAGE_S_EXPRESSION_ID} from '../../../../../../utils/monaco/s-expression/constants';

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
                language={LANGUAGE_S_EXPRESSION_ID}
                value={ast}
                options={EDITOR_OPTIONS}
                theme={`vs-${theme}`}
            />
        </div>
    );
}
