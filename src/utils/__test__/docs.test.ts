import {configureUIFactory} from '../../uiFactory/uiFactory';
import {getDocsLink} from '../docs';

describe('getDocsLink', () => {
    afterEach(() => {
        // Reset docs config back to the library default (undefined).
        configureUIFactory({docs: undefined});
    });

    it('should return undefined when docs is not configured', () => {
        configureUIFactory({docs: undefined});

        expect(getDocsLink('autoPartitioningMaxPartitionsCount')).toBeUndefined();
    });

    it('should return undefined when the requested article path is not set', () => {
        configureUIFactory({docs: {basePath: 'https://ydb.tech'}});

        expect(getDocsLink('autoPartitioningMaxPartitionsCount')).toBeUndefined();
    });

    it('should build the link from basePath and the article path', () => {
        configureUIFactory({
            docs: {
                basePath: 'https://ydb.tech',
                autoPartitioningMaxPartitionsCount:
                    '/docs/ru/concepts/datamodel/table?version=v25.4#auto_partitioning_max_partitions_count',
            },
        });

        expect(getDocsLink('autoPartitioningMaxPartitionsCount')).toBe(
            'https://ydb.tech/docs/ru/concepts/datamodel/table?version=v25.4#auto_partitioning_max_partitions_count',
        );
    });

    it('should keep exactly one slash between basePath and article path when basePath has a trailing slash', () => {
        configureUIFactory({
            docs: {
                basePath: 'https://ydb.tech/',
                autoPartitioningMaxPartitionsCount: '/docs/ru/concepts/datamodel/table',
            },
        });

        expect(getDocsLink('autoPartitioningMaxPartitionsCount')).toBe(
            'https://ydb.tech/docs/ru/concepts/datamodel/table',
        );
    });

    it('should keep exactly one slash when neither basePath nor article path has a slash at the join', () => {
        configureUIFactory({
            docs: {
                basePath: 'https://ydb.tech',
                autoPartitioningMaxPartitionsCount: 'docs/ru/concepts/datamodel/table',
            },
        });

        expect(getDocsLink('autoPartitioningMaxPartitionsCount')).toBe(
            'https://ydb.tech/docs/ru/concepts/datamodel/table',
        );
    });

    it('should preserve the query string and hash in the article path', () => {
        configureUIFactory({
            docs: {
                basePath: 'https://ydb.tech/',
                autoPartitioningMaxPartitionsCount:
                    '/docs/ru/concepts/datamodel/table?version=v25.4#auto_partitioning_max_partitions_count',
            },
        });

        expect(getDocsLink('autoPartitioningMaxPartitionsCount')).toBe(
            'https://ydb.tech/docs/ru/concepts/datamodel/table?version=v25.4#auto_partitioning_max_partitions_count',
        );
    });
});
