import {lazyComponent} from '../../../utils/lazyComponent';

export const ConnectToDBSyntaxHighlighterLazy = lazyComponent(
    () => import('./ConnectToDBSyntaxHighlighter'),
    'ConnectToDBSyntaxHighlighter',
);
