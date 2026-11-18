import React from 'react';

import {Xmark} from '@gravity-ui/icons';
import {Button, Icon, Popover, Tooltip} from '@gravity-ui/uikit';

import {DatacenterLabel} from '../../../../components/Datacenter/DatacenterLabel';
import {cn} from '../../../../utils/cn';
import {normalizeDatacenter} from '../../../../utils/datacenters';
import {useNodesMap} from '../../../../utils/hooks/useNodesMap';
import i18n from '../i18n';

import './DatacenterLegend.scss';

const b = cn('ydb-datacenter-legend');
const VISIBLE_DATACENTERS_LIMIT = 10;

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
    const [open, setOpen] = React.useState(false);
    const hiddenNames = names.slice(VISIBLE_DATACENTERS_LIMIT);
    const hiddenCount = hiddenNames.length;
    const moreText = i18n('action_more-datacenters', {count: hiddenCount});
    const disk = i18n(diskType === 'vdisk' ? 'value_vdisks' : 'value_pdisks');

    React.useEffect(() => {
        if (!hiddenCount) {
            setOpen(false);
        }
    }, [hiddenCount]);

    return (
        <div className={b()} data-qa={`${diskType}-datacenter-legend`}>
            <div className={b('visible')}>
                {names.slice(0, VISIBLE_DATACENTERS_LIMIT).map((name) => (
                    <DatacenterLabel key={name} name={name} />
                ))}
                <DatacenterLabel />
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
                                            key={name}
                                            content={name}
                                            className={b('popover-label')}
                                        >
                                            <span tabIndex={0}>
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
