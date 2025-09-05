import React, {useState} from 'react';

import {Popover, Tab, TabList, TabPanel, TabProvider} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';

import type {
    ExtendedTBlock,
    TopologyNodeDataStatsItem,
    TopologyNodeDataStatsSection,
} from './types';

const b = cn('ydb-gravity-graph');
type Props = {
    block: ExtendedTBlock;
    children: React.ReactNode;
};

const getStatsContent = (stat: TopologyNodeDataStatsItem | TopologyNodeDataStatsSection) => {
    if ('value' in stat) {
        return (
            <p className={b('tooltip-stat-row')} key={stat.name}>
                <span>{stat.name}:</span>
                <span>{stat.value}</span>
            </p>
        );
    }

    return (
        <section className={b('tooltip-stat-group')} key={stat.name}>
            <div className={b('tooltip-stat-group-name')}>{stat.name}:</div>
            {stat.items?.map(({name, value}: TopologyNodeDataStatsItem) => (
                <p className={b('tooltip-stat-row')} key={name}>
                    <span>{name}:</span>
                    <span>{value}</span>
                </p>
            ))}
        </section>
    );
};

const useTooltipContent = (block: ExtendedTBlock) => {
    const firstTab = block?.stats?.[0]?.group || '';
    const [activeTab, setActiveTab] = useState(firstTab);

    return (
        <TabProvider value={activeTab} onUpdate={setActiveTab}>
            <TabList className={b('tooltip-tabs')}>
                {block?.stats?.map((item) => (
                    <Tab value={item.group} key={item.group}>
                        {item.group}
                    </Tab>
                ))}
            </TabList>
            {block?.stats?.map((item) => (
                <TabPanel value={item.group} key={item.group}>
                    {item.stats?.map(getStatsContent)}
                </TabPanel>
            ))}
        </TabProvider>
    );
};

export const TooltipComponent = ({block, children}: Props) => {
    const content = useTooltipContent(block);

    return (
        <Popover
            content={content}
            hasArrow
            trigger="click"
            placement="right-start"
            className="ydb-gravity-graph__tooltip-content"
            disablePortal
            strategy="fixed"
        >
            {children as React.ReactElement}
        </Popover>
    );
};
