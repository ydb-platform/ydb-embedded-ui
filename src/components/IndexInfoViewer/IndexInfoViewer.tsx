import type {TEvDescribeSchemeResult, TIndexDescription} from '../../types/api/schema';
import {InfoViewer, createInfoFormatter} from '../InfoViewer';

const DISPLAYED_FIELDS: Set<keyof TIndexDescription> = new Set([
    'Type',
    'State',
    'DataSize',
    'KeyColumnNames',
    'DataColumnNames',
]);

const formatItem = createInfoFormatter<TIndexDescription>({
    Type: (value) => value?.substring(10), // trims EIndexType prefix
    State: (value) => value?.substring(11), // trims EIndexState prefix
    KeyColumnNames: (value) => value?.join(', '),
    DataColumnNames: (value) => value?.join(', '),
}, {
    KeyColumnNames: 'Columns',
    DataColumnNames: 'Includes',
});

interface IndexInfoViewerProps {
    data?: TEvDescribeSchemeResult;
}

export const IndexInfoViewer = ({data}: IndexInfoViewerProps) => {
    if (!data) {
        return (
            <div className="error">no index data</div>
        );
    }

    const TableIndex = data.PathDescription?.TableIndex;
    const info: Array<{label?: string, value?: unknown}> = [];

    let key: keyof TIndexDescription;
    for (key in TableIndex) {
        if (DISPLAYED_FIELDS.has(key)) {
            info.push(formatItem(key, TableIndex?.[key]));
        }
    }

    return (
        <>
            {info.length ? (
                <InfoViewer info={info}></InfoViewer>
            ) : (
                <>Empty</>
            )}
        </>
    );
};
