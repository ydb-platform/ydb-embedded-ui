import type {DocsConfig} from '../uiFactory/types';
import {uiFactory} from '../uiFactory/uiFactory';

/**
 * Keys of the documentation articles configured in `uiFactory.docs`
 * (everything except the `basePath` field).
 */
type DocsArticle = Exclude<keyof DocsConfig, 'basePath'>;

/**
 * Generates a link to a documentation article based on the `docs` config from `uiFactory`.
 *
 * Returns `undefined` when documentation is not configured (`uiFactory.docs` is undefined)
 * or when the requested article path is not set.
 */
export function getDocsLink(article: DocsArticle): string | undefined {
    const docs = uiFactory.docs;

    if (!docs) {
        return undefined;
    }

    const articlePath = docs[article];

    if (!articlePath) {
        return undefined;
    }

    // Normalize so there is exactly one slash between basePath and articlePath.
    // Only leading/trailing slashes at the join point are touched, so the rest of the
    // article path (including its query string and hash, e.g.
    // `/concepts/...?version=v25.4#anchor`) is preserved exactly.
    const basePath = docs.basePath.replace(/\/+$/, '');
    const normalizedArticlePath = articlePath.replace(/^\/+/, '');

    return `${basePath}/${normalizedArticlePath}`;
}
