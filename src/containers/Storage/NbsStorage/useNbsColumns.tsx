import {Button, Flex, Label, Link, Text} from '@gravity-ui/uikit';

import type {Column} from '../../../components/PaginatedTable';
import {ProgressViewer} from '../../../components/ProgressViewer/ProgressViewer';
import type {DDiskComponentStatus} from '../../../types/api/ddisk';
import {formatBytes} from '../../../utils/bytesParsers';
import {EMPTY_DATA_PLACEHOLDER} from '../../../utils/constants';
import {getDDiskDeveloperUIHrefs} from '../../../utils/developerUI/ddisk';
import {
    createTabletDeveloperUIHref,
    useHasDeveloperUi,
} from '../../../utils/developerUI/developerUI';

import {formatUsage} from './getData';
import type {NbsRow} from './getData';
import i18n from './i18n';

function renderRoleStatus(status?: DDiskComponentStatus, reason?: string) {
    const labels = {
        Ready: {text: i18n('status-ready'), theme: 'success'},
        Initializing: {text: i18n('status-initializing'), theme: 'warning'},
        Broken: {text: i18n('status-broken'), theme: 'danger'},
        Stopping: {text: i18n('status-stopping'), theme: 'warning'},
    } as const;
    const label = status && labels[status];
    return (
        <Flex direction="column" alignItems="flex-start" gap={1}>
            <Label theme={label?.theme}>{label?.text ?? i18n('unknown')}</Label>
            {reason && (
                <Text variant="caption-2" ellipsis title={reason}>
                    {reason}
                </Text>
            )}
        </Flex>
    );
}

export function useNbsColumns(disks: boolean, onShowGroups: (tabletId: string) => void) {
    const hasDeveloperUi = useHasDeveloperUi();
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
              column('disk', i18n('disk'), ({row}) => {
                  if ('TabletId' in row) {
                      return null;
                  }
                  const id = `${row.DiskId.NodeId}:${row.DiskId.PDiskId}:${row.DiskId.DDiskSlotId}`;
                  const href = getDDiskDeveloperUIHrefs(row.DiskId).ddisk;
                  return hasDeveloperUi && href ? <Link href={href}>{id}</Link> : id;
              }),
              column('pool', i18n('pool'), ({row}) =>
                  'TabletId' in row ? null : row.StoragePoolName || EMPTY_DATA_PLACEHOLDER,
              ),
              column(
                  'buffer',
                  i18n('buffer'),
                  ({row}) => {
                      if ('TabletId' in row) {
                          return null;
                      }
                      const href = getDDiskDeveloperUIHrefs({
                          NodeId: row.DiskId.NodeId,
                          PersistentBufferId: row.PersistentBufferId,
                      }).buffer;
                      const id = row.PersistentBufferId || EMPTY_DATA_PLACEHOLDER;
                      return hasDeveloperUi && href ? <Link href={href}>{id}</Link> : id;
                  },
                  200,
              ),
              column('state', i18n('pdisk-state'), ({row}) =>
                  !('TabletId' in row) ? (row.State ?? EMPTY_DATA_PLACEHOLDER) : null,
              ),
              column('ddisk-status', i18n('ddisk-status'), ({row}) =>
                  !('TabletId' in row)
                      ? renderRoleStatus(row.DDiskStatus, row.DDiskStatusReason)
                      : null,
              ),
              column(
                  'buffer-status',
                  i18n('buffer-status'),
                  ({row}) =>
                      !('TabletId' in row)
                          ? renderRoleStatus(
                                row.PersistentBufferStatus,
                                row.PersistentBufferStatusReason,
                            )
                          : null,
                  200,
              ),
              column(
                  'shared-slot',
                  i18n('shared-slot'),
                  ({row}) =>
                      !('TabletId' in row) &&
                      row.AllocatedSize !== undefined &&
                      row.TotalSize !== undefined
                          ? `${formatBytes({value: row.AllocatedSize})} / ${formatBytes({value: row.TotalSize})}`
                          : EMPTY_DATA_PLACEHOLDER,
                  180,
              ),
              column('ddiskUsage', i18n('ddisk-usage'), ({row}) =>
                  !('TabletId' in row) ? usage(row.DDiskOccupancy) : null,
              ),
              column(
                  'bufferUsage',
                  i18n('buffer-usage'),
                  ({row}) => (!('TabletId' in row) ? usage(row.PersistentBufferOccupancy) : null),
                  220,
              ),
              column(
                  'ddiskTablets',
                  i18n('ddisk-tablets'),
                  ({row}) =>
                      !('TabletId' in row)
                          ? (row.DDiskTabletCount ?? EMPTY_DATA_PLACEHOLDER)
                          : null,
                  180,
              ),
              column(
                  'bufferTablets',
                  i18n('buffer-tablets'),
                  ({row}) =>
                      !('TabletId' in row)
                          ? (row.PersistentBufferTabletCount ?? EMPTY_DATA_PLACEHOLDER)
                          : null,
                  180,
              ),
          ]
        : [
              column(
                  'tablet',
                  i18n('tablet'),
                  ({row}) => {
                      if (!('TabletId' in row)) {
                          return null;
                      }
                      return hasDeveloperUi ? (
                          <Link href={createTabletDeveloperUIHref(row.TabletId, 'app')}>
                              {row.TabletId}
                          </Link>
                      ) : (
                          row.TabletId
                      );
                  },
                  220,
              ),
              column(
                  'diskId',
                  i18n('disk-id'),
                  ({row}) => ('TabletId' in row ? row.DiskId || EMPTY_DATA_PLACEHOLDER : null),
                  260,
              ),
              column('groups', i18n('groups'), ({row}) =>
                  'TabletId' in row ? (
                      <Button
                          view="flat"
                          aria-label={i18n('show-groups', {tabletId: row.TabletId})}
                          onClick={() => onShowGroups(row.TabletId)}
                      >
                          {row.GroupsCount ?? EMPTY_DATA_PLACEHOLDER}
                      </Button>
                  ) : null,
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
          ];
    return columns;
}
