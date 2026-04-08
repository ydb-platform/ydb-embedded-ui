import {Button, Flex, Text} from '@gravity-ui/uikit';

import {CellWithPopover} from '../../components/CellWithPopover/CellWithPopover';
import {ClipboardButton} from '../../components/ClipboardButton/ClipboardButton';
import {getPDiskPagePath} from '../../routes';
import type {VDiskData} from '../../store/reducers/vdisk/types';
import {cn} from '../../utils/cn';
import {EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';
import {formatNumber, formatStorageValuesToGb} from '../../utils/dataFormatters/dataFormatters';

import {vDiskPageKeyset} from './i18n';

import './VDiskStorageDetails.scss';

const b = cn('ydb-vdisk-storage-details');

interface VDiskStorageDetailsProps {
    className?: string;
    data?: VDiskData;
}

interface MetricItemProps {
    title: string;
    value: string;
    isUsage?: boolean;
}

interface CopyableDetailItemProps {
    title: string;
    value?: string | number;
}

interface DetailItemProps {
    title: string;
    value?: string | number;
}

interface TruncatedDetailValueProps {
    value?: string | number;
}

function formatStorageMetric(value?: number) {
    const [formattedValue] = formatStorageValuesToGb(value);

    return formattedValue || EMPTY_DATA_PLACEHOLDER;
}

function formatUsage(value?: number) {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
        return EMPTY_DATA_PLACEHOLDER;
    }

    const formattedValue = formatNumber(numericValue);

    return formattedValue ? `${formattedValue}%` : EMPTY_DATA_PLACEHOLDER;
}

function getFreeSize(availableSize?: number, sizeLimit?: number, allocatedSize?: number) {
    const normalizedAvailableSize = Number(availableSize);

    if (Number.isFinite(normalizedAvailableSize) && normalizedAvailableSize >= 0) {
        return normalizedAvailableSize;
    }

    const normalizedSizeLimit = Number(sizeLimit);
    const normalizedAllocatedSize = Number(allocatedSize);

    if (!Number.isFinite(normalizedSizeLimit) || normalizedSizeLimit < 0) {
        return undefined;
    }

    if (!Number.isFinite(normalizedAllocatedSize) || normalizedAllocatedSize < 0) {
        return normalizedSizeLimit;
    }

    return Math.max(normalizedSizeLimit - normalizedAllocatedSize, 0);
}

function MetricItem({title, value, isUsage}: MetricItemProps) {
    return (
        <div className={b('metric', {usage: isUsage})}>
            <Text variant="subheader-2" className={b('value')}>
                {value}
            </Text>
            <Text color="secondary" className={b('label')}>
                {title}
            </Text>
        </div>
    );
}

function DetailItem({title, value}: DetailItemProps) {
    return (
        <div className={b('detail')}>
            <TruncatedDetailValue value={value} />
            <Text color="secondary" className={b('label')}>
                {title}
            </Text>
        </div>
    );
}

function TruncatedDetailValue({value}: TruncatedDetailValueProps) {
    const normalizedValue =
        value === undefined || value === null || value === '' ? undefined : String(value);
    const displayValue = normalizedValue ?? EMPTY_DATA_PLACEHOLDER;

    return (
        <CellWithPopover
            content={normalizedValue}
            disabled={!normalizedValue}
            placement={['top', 'bottom']}
            fullWidth
            wrapperClassName={b('value-popover')}
            className={b('value-popover-content')}
        >
            <Text variant="subheader-2" className={b('value')}>
                {displayValue}
            </Text>
        </CellWithPopover>
    );
}

function CopyableDetailItem({title, value}: CopyableDetailItemProps) {
    const normalizedValue =
        value === undefined || value === null || value === '' ? undefined : String(value);
    const displayValue = normalizedValue ?? EMPTY_DATA_PLACEHOLDER;

    return (
        <div className={b('detail')}>
            <Flex alignItems="center" gap="1" className={b('value-row', {copyable: true})}>
                <CellWithPopover
                    content={normalizedValue}
                    disabled={!normalizedValue}
                    placement={['top', 'bottom']}
                    fullWidth
                    wrapperClassName={b('value-popover', {copyable: true})}
                    className={b('value-popover-content', {copyable: true})}
                >
                    <Text variant="subheader-2" className={b('value')}>
                        {displayValue}
                    </Text>
                </CellWithPopover>
                <ClipboardButton
                    copyText={normalizedValue}
                    withLabel={false}
                    view="flat-secondary"
                />
            </Flex>
            <Text color="secondary" className={b('label')}>
                {title}
            </Text>
        </div>
    );
}

export function VDiskStorageDetails({className, data}: VDiskStorageDetailsProps) {
    const used = Number(data?.AllocatedSize);
    const total = Number(data?.SizeLimit);
    const usage = Number(data?.AllocatedPercent);
    const free = getFreeSize(data?.AvailableSize, data?.SizeLimit, data?.AllocatedSize);

    const {NodeDC, NodeRack, NodeHost, NodeId, PDiskId} = data || {};

    const pDiskPath =
        NodeId !== undefined && PDiskId !== undefined
            ? getPDiskPagePath(PDiskId, NodeId)
            : undefined;

    return (
        <div className={b(null, className)}>
            <Flex alignItems="center" gap="1" className={b('title')}>
                <Text variant="subheader-2">{vDiskPageKeyset('title_storage-details')}</Text>
            </Flex>
            <div className={b('cards')}>
                <div className={b('card', {metrics: true})}>
                    <MetricItem
                        title={vDiskPageKeyset('field_storage-details-used')}
                        value={formatStorageMetric(used)}
                    />
                    <MetricItem
                        title={vDiskPageKeyset('field_storage-details-total')}
                        value={formatStorageMetric(total)}
                    />
                    <MetricItem
                        title={vDiskPageKeyset('field_storage-details-free')}
                        value={formatStorageMetric(free)}
                    />
                    <MetricItem
                        title={vDiskPageKeyset('field_storage-details-usage')}
                        value={formatUsage(usage)}
                        isUsage
                    />
                </div>
                <div className={b('card', {details: true})}>
                    <div className={b('details')}>
                        <DetailItem title={vDiskPageKeyset('field_datacenter')} value={NodeDC} />
                        <CopyableDetailItem
                            title={vDiskPageKeyset('field_rack')}
                            value={NodeRack}
                        />
                        <CopyableDetailItem
                            title={vDiskPageKeyset('field_node')}
                            value={NodeHost}
                        />
                        <CopyableDetailItem
                            title={vDiskPageKeyset('field_pdisk-id')}
                            value={PDiskId}
                        />
                    </div>
                    {pDiskPath ? (
                        <Button href={pDiskPath} view="action" size="m">
                            {vDiskPageKeyset('action_go-to-pdisk')}
                        </Button>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
