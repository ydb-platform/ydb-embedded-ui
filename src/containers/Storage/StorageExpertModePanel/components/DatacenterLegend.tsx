import React from 'react';

import {Xmark} from '@gravity-ui/icons';
import {Button, Icon, Popover, Tooltip, useResizeObserver} from '@gravity-ui/uikit';

import {DatacenterLabel} from '../../../../components/Datacenter/DatacenterLabel';
import {cn} from '../../../../utils/cn';
import {normalizeDatacenter} from '../../../../utils/datacenters';
import {useNodesMap} from '../../../../utils/hooks/useNodesMap';
import i18n from '../i18n';

import {getDatacenterLegendLayout} from './getDatacenterLegendLayout';

import './DatacenterLegend.scss';

const b = cn('ydb-datacenter-legend');

function getAvailableWidth(root: HTMLElement) {
    const table = root.closest('.ydb-table-with-controls-layout');
    const container = table?.parentElement ?? root.parentElement;
    if (!container) {
        return root.getBoundingClientRect().width;
    }
    const containerStyle = getComputedStyle(container);
    let right =
        container.getBoundingClientRect().right -
        parseFloat(containerStyle.paddingRight) -
        parseFloat(containerStyle.borderRightWidth);
    if (table) {
        const controls = table.querySelector('.ydb-table-with-controls-layout__controls-wrapper');
        const extra = table.querySelector('.ydb-table-with-controls-layout__extra-controls');
        const panel = root.closest('.ydb-storage-expert-mode-panel');
        right -=
            (extra?.getBoundingClientRect().width ?? 0) +
            (controls ? parseFloat(getComputedStyle(controls).columnGap) || 0 : 0) +
            (panel ? parseFloat(getComputedStyle(panel).paddingRight) || 0 : 0);
    }
    return Math.max(0, right - root.getBoundingClientRect().left);
}

export function DatacenterLegend({diskType}: {diskType: 'vdisk' | 'pdisk'}) {
    const nodes = useNodesMap();
    const names = React.useMemo(
        () =>
            [
                ...new Set(
                    [...(nodes?.values() ?? [])]
                        .map((node) => normalizeDatacenter(node.DCKey || node.DC))
                        .filter((name) => name !== undefined),
                ),
            ].sort(),
        [nodes],
    );
    const rootRef = React.useRef<HTMLDivElement | null>(null);
    const containerRef = React.useRef<HTMLElement | null>(null);
    const extraControlsRef = React.useRef<Element | null>(null);
    const measureRef = React.useRef<HTMLDivElement>(null);
    const unknownRef = React.useRef<HTMLSpanElement>(null);
    const moreRef = React.useRef<HTMLSpanElement>(null);
    const [layout, setLayout] = React.useState<{
        visibleCount: number;
        showUnknown: boolean;
        maxWidth?: number;
    }>({visibleCount: 0, showUnknown: true});
    const [open, setOpen] = React.useState(false);
    const hiddenNames = [
        ...names.slice(layout.visibleCount),
        ...(layout.showUnknown ? [] : [undefined]),
    ];
    const hiddenCount = hiddenNames.length;
    const moreText = i18n('action_more-datacenters', {count: Math.max(1, hiddenCount)});
    const disk = i18n(diskType === 'vdisk' ? 'value_vdisks' : 'value_pdisks');

    const measure = React.useCallback(() => {
        const root = rootRef.current;
        const measured = measureRef.current;
        if (!root || !measured || !unknownRef.current || !moreRef.current) {
            return;
        }
        const available = getAvailableWidth(root);
        const next = getDatacenterLegendLayout({
            labels: Array.from(measured.querySelectorAll('[data-dc-name]')).map(
                (element) => element.getBoundingClientRect().width,
            ),
            available,
            unknown: unknownRef.current.getBoundingClientRect().width,
            more: moreRef.current.getBoundingClientRect().width,
            gap: parseFloat(getComputedStyle(measured).columnGap) || 0,
        });
        setLayout((previous) =>
            previous.visibleCount === next.visibleCount &&
            previous.showUnknown === next.showUnknown &&
            previous.maxWidth === available
                ? previous
                : {...next, maxWidth: available},
        );
    }, []);

    const setRootRef = React.useCallback((root: HTMLDivElement | null) => {
        rootRef.current = root;
        const table = root?.closest('.ydb-table-with-controls-layout');
        containerRef.current = table?.parentElement ?? root?.parentElement ?? null;
        extraControlsRef.current =
            table?.querySelector('.ydb-table-with-controls-layout__extra-controls') ?? null;
    }, []);
    useResizeObserver({ref: rootRef, onResize: measure});
    useResizeObserver({ref: containerRef, onResize: measure});
    useResizeObserver({ref: extraControlsRef, onResize: measure});
    useResizeObserver({ref: measureRef, onResize: measure});
    React.useLayoutEffect(measure, [measure, names, hiddenCount]);
    React.useEffect(() => {
        if (!hiddenCount) {
            setOpen(false);
        }
    }, [hiddenCount]);

    return (
        <div
            ref={setRootRef}
            className={b()}
            style={{maxWidth: layout.maxWidth}}
            data-qa={`${diskType}-datacenter-legend`}
        >
            <div className={b('measure')} aria-hidden="true">
                <div ref={measureRef} className={b('measure-row')}>
                    {names.map((name) => (
                        <span key={name} data-dc-name>
                            <DatacenterLabel name={name} />
                        </span>
                    ))}
                    <span ref={unknownRef}>
                        <DatacenterLabel />
                    </span>
                    <span ref={moreRef}>
                        <Button size="xs" view="normal">
                            {moreText}
                        </Button>
                    </span>
                </div>
            </div>
            <div className={b('visible')}>
                {names.slice(0, layout.visibleCount).map((name) => (
                    <DatacenterLabel key={name} name={name} />
                ))}
                {layout.showUnknown && <DatacenterLabel />}
                {hiddenCount > 0 && (
                    <Popover
                        className={b('popup')}
                        open={open}
                        onOpenChange={setOpen}
                        trigger="click"
                        placement={['right-start', 'bottom-end']}
                        hasArrow
                        content={
                            <div
                                className={b('popover')}
                                data-qa={`${diskType}-datacenter-popover`}
                            >
                                <div className={b('popover-labels')}>
                                    {hiddenNames.map((name) => (
                                        <Tooltip
                                            key={name ?? ''}
                                            content={name}
                                            disabled={!name}
                                            className={b('popover-label')}
                                        >
                                            <span tabIndex={name ? 0 : undefined}>
                                                <DatacenterLabel name={name} />
                                            </span>
                                        </Tooltip>
                                    ))}
                                </div>
                                <Button
                                    className={b('close')}
                                    view="flat-secondary"
                                    size="s"
                                    aria-label={i18n('action_close-datacenters', {disk})}
                                    onClick={() => setOpen(false)}
                                >
                                    <Icon data={Xmark} size={14} />
                                </Button>
                            </div>
                        }
                    >
                        <Button
                            size="xs"
                            view="normal"
                            aria-label={i18n('action_show-more-datacenters', {
                                count: hiddenCount,
                                disk,
                            })}
                        >
                            {moreText}
                        </Button>
                    </Popover>
                )}
            </div>
        </div>
    );
}
