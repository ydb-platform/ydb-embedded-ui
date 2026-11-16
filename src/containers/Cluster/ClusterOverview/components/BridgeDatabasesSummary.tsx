import {ArrowsRotateLeft, Check, CircleQuestion, Clock} from '@gravity-ui/icons';
import {Flex, Icon, Label, Text, Tooltip} from '@gravity-ui/uikit';
import type {IconData, LabelProps} from '@gravity-ui/uikit';

import type {TBridgeInfo} from '../../../../types/api/cluster';
import {BridgeSyncStatus} from '../../../../types/api/cluster';
import {cn} from '../../../../utils/cn';
import {EMPTY_DATA_PLACEHOLDER} from '../../../../utils/constants';
import {formatNumber} from '../../../../utils/dataFormatters/dataFormatters';
import {parseOptionalNonNegativeNumber} from '../../../../utils/utils';
import i18n from '../../i18n';

import {getBridgeDatabaseCounts} from './bridgeInfo';

const b = cn('ydb-bridge-info-table');

const statusPresentation: Record<
    Exclude<BridgeSyncStatus, BridgeSyncStatus.NOT_REQUIRED>,
    {icon: IconData; theme: LabelProps['theme']; label: () => string}
> = {
    [BridgeSyncStatus.SYNCED]: {
        icon: Check,
        theme: 'success',
        label: () => i18n('value_bridge-sync-synced'),
    },
    [BridgeSyncStatus.SYNCING]: {
        icon: ArrowsRotateLeft,
        theme: 'info',
        label: () => i18n('value_bridge-sync-syncing'),
    },
    [BridgeSyncStatus.PENDING]: {
        icon: Clock,
        theme: 'warning',
        label: () => i18n('value_bridge-sync-pending'),
    },
    [BridgeSyncStatus.UNKNOWN]: {
        icon: CircleQuestion,
        theme: 'unknown',
        label: () => i18n('value_bridge-sync-unknown'),
    },
};

export function BridgeDatabasesSummary({bridgeInfo}: {bridgeInfo: TBridgeInfo}) {
    const counts = getBridgeDatabaseCounts(bridgeInfo);
    const total = parseOptionalNonNegativeNumber(bridgeInfo.BridgeDatabases);
    if (!counts?.length && total === undefined) {
        return null;
    }

    const incomplete = bridgeInfo.BridgeDatabasesComplete === false;

    return (
        <Flex gap={1} alignItems="center" wrap qa="bridge-databases-summary">
            <Text color="secondary">{i18n('field_bridge-databases')}:</Text>
            <Flex gap={1} alignItems="center" wrap>
                {counts?.length ? (
                    counts.map(({status, count}) => {
                        const {icon, theme, label} = statusPresentation[status];
                        const statusTitle = i18n('context_bridge-sync-status', {status: label()});
                        const title = incomplete
                            ? `${statusTitle}. ${i18n('context_bridge-databases-incomplete')}`
                            : statusTitle;
                        const formattedCount = formatNumber(count);
                        return (
                            <Tooltip key={status} content={title} openDelay={500}>
                                <span
                                    className={b('summary-status')}
                                    tabIndex={0}
                                    role="img"
                                    aria-label={`${title}: ${formattedCount}`}
                                >
                                    <Label
                                        theme={theme}
                                        size="xxs"
                                        icon={<Icon data={icon} size={12} />}
                                        qa={`bridge-databases-${status}`}
                                    >
                                        {formattedCount}
                                    </Label>
                                </span>
                            </Tooltip>
                        );
                    })
                ) : (
                    <Text>
                        {total === undefined ? EMPTY_DATA_PLACEHOLDER : formatNumber(total)}
                    </Text>
                )}
            </Flex>
        </Flex>
    );
}
