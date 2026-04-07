import {Flex, Text} from '@gravity-ui/uikit';

import type {StorageUsageSection} from '../../../../store/reducers/storageUsage/StorageUsage';
import {cn} from '../../../../utils/cn';
import {UNKNOWN_MEDIA_TYPE} from '../../../../utils/disks/normalizeMediaType';
import i18n from '../i18n';

import {MediaSectionSummary} from './MediaSectionSummary';

import './StorageUsageSections.scss';

const b = cn('ydb-storage-usage-sections');

interface StorageUsageSectionsProps {
    hasMultipleMediaTypes: boolean;
    sections: StorageUsageSection[];
    isStorageUsageFetching: boolean;
}

function getMediaSectionLabel(mediaLabel: string) {
    if (mediaLabel === UNKNOWN_MEDIA_TYPE) {
        return i18n('value_storage-usage-media-unknown');
    }

    return mediaLabel;
}

export function StorageUsageSections({
    hasMultipleMediaTypes,
    sections,
    isStorageUsageFetching,
}: StorageUsageSectionsProps) {
    if (sections.length === 0 && !isStorageUsageFetching) {
        return (
            <Text color="secondary" className={b('empty')}>
                {i18n('context_storage-usage-empty')}
            </Text>
        );
    }

    return sections.map((section) => (
        <Flex key={section.mediaKey} direction="column" gap={3} className={b('section')}>
            {hasMultipleMediaTypes ? (
                <Text variant="subheader-2">{getMediaSectionLabel(section.mediaLabel)}</Text>
            ) : null}
            <MediaSectionSummary section={section} />
        </Flex>
    ));
}
