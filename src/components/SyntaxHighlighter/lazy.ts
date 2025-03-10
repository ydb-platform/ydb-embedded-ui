import {lazyComponent} from '../../utils/lazyComponent';

export const YDBSyntaxHighlighterLazy = lazyComponent(
    () => import('./YDBSyntaxHighlighter'),
    'YDBSyntaxHighlighter',
);
