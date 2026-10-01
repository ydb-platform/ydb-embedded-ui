import {Link} from '@gravity-ui/uikit';

import type {Column} from '../../../components/PaginatedTable';
import {ProgressViewer} from '../../../components/ProgressViewer/ProgressViewer';
import {EMPTY_DATA_PLACEHOLDER} from '../../../utils/constants';
import {createTabletDeveloperUIHref} from '../../../utils/developerUI/developerUI';

import {formatUsage} from './getData';
import type {NbsRow} from './getData';
import i18n from './i18n';

export function useNbsColumns(disks: boolean) {
    const usage = (value?: number) =>
        formatUsage(value) === undefined ? (
            EMPTY_DATA_PLACEHOLDER
        ) : (
            <ProgressViewer
                value={value}
                capacity={1}
                colorizeProgress
                withOverflow
                formatValues={() => [formatUsage(value) ?? EMPTY_DATA_PLACEHOLDER, '']}
                hideCapacity
            />
        );
    const column = (
        name: string,
        header: string,
        render: Column<NbsRow>['render'],
        width = 160,
    ): Column<NbsRow> => ({
        name,
        header,
        render,
        width,
        align: 'left',
    });
    const columns: Column<NbsRow>[] = disks
        ? [
              column('disk', i18n('disk'), ({row}) =>
                  'DiskId' in row
                      ? `${row.DiskId.NodeId}:${row.DiskId.PDiskId}:${row.DiskId.DDiskSlotId}`
                      : null,
              ),
              column('state', i18n('state'), ({row}) =>
                  'DiskId' in row ? (row.State ?? EMPTY_DATA_PLACEHOLDER) : null,
              ),
              column('ddiskUsage', i18n('ddisk-usage'), ({row}) =>
                  'DiskId' in row ? usage(row.DDiskOccupancy) : null,
              ),
              column(
                  'bufferUsage',
                  i18n('buffer-usage'),
                  ({row}) => ('DiskId' in row ? usage(row.PersistentBufferOccupancy) : null),
                  220,
              ),
              column(
                  'ddiskTablets',
                  i18n('ddisk-tablets'),
                  ({row}) =>
                      'DiskId' in row ? (row.DDiskTabletCount ?? EMPTY_DATA_PLACEHOLDER) : null,
                  180,
              ),
              column(
                  'bufferTablets',
                  i18n('buffer-tablets'),
                  ({row}) =>
                      'DiskId' in row
                          ? (row.PersistentBufferTabletCount ?? EMPTY_DATA_PLACEHOLDER)
                          : null,
                  180,
              ),
          ]
        : [
              column(
                  'tablet',
                  i18n('tablet'),
                  ({row}) =>
                      'TabletId' in row ? (
                          <Link href={createTabletDeveloperUIHref(row.TabletId, 'app')}>
                              {row.TabletId}
                          </Link>
                      ) : null,
                  220,
              ),
              column('groups', i18n('groups'), ({row}) =>
                  'TabletId' in row ? (row.GroupsCount ?? EMPTY_DATA_PLACEHOLDER) : null,
              ),
              column(
                  'usage',
                  i18n('usage'),
                  ({row}) => ('TabletId' in row ? usage(row.DiskUsage) : null),
                  200,
              ),
              column('degrade', i18n('degrade'), ({row}) =>
                  'TabletId' in row ? (row.Degrade ?? EMPTY_DATA_PLACEHOLDER) : null,
              ),
              column(
                  'missingDDisk',
                  i18n('missing-ddisks'),
                  ({row}) =>
                      'TabletId' in row
                          ? (row.UnavailableDDiskCount ?? EMPTY_DATA_PLACEHOLDER)
                          : null,
                  190,
              ),
              column(
                  'missingBuffer',
                  i18n('missing-buffers'),
                  ({row}) =>
                      'TabletId' in row
                          ? (row.UnavailablePersistentBufferCount ?? EMPTY_DATA_PLACEHOLDER)
                          : null,
                  190,
              ),
          ];
    return columns;
}
