import i18n from './i18n';
import type {SnippetLanguage} from './types';

export function getDocsLink(snippetLang: SnippetLanguage) {
    switch (snippetLang) {
        case 'bash': {
            return i18n('docs_bash');
        }
        case 'cpp': {
            return i18n('docs_cpp');
        }
        case 'csharp': {
            return i18n('docs_dotnet');
        }
        case 'go': {
            return i18n('docs_go');
        }
        case 'java': {
            return i18n('docs_java');
        }
        case 'javascript': {
            return i18n('docs_nodejs');
        }
        case 'php': {
            return i18n('docs_php');
        }
        case 'python': {
            return i18n('docs_python');
        }
        default: {
            return undefined;
        }
    }
}
