import React, {useState, useMemo} from 'react';
import type {TBlock} from '@gravity-ui/graph';
import {Text, Popover, TabProvider, TabList, Tab, TabPanel} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';
const b = cn('ydb-gravity-graph');
type Props = {
    block: TBlock;
    children: React.ReactNode;
};

const getStatsContent = (stat) => {
    if (!stat.items) {
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
            {stat.items?.map(({name, value}) => (
                <p className={b('tooltip-stat-row')} key={name}>
                    <span>{name}:</span>
                    <span>{value}</span>
                </p>
            ))}
        </section>
    );
};

const getTooltipContent = (block: TBlock) => {
    const [activeTab, setActiveTab] = useState(block?.stats[0]?.group);

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
    return (
        <Popover
            content={getTooltipContent(block)}
            hasArrow
            trigger="click"
            placement="right-start"
            className="ydb-gravity-graph__tooltip-content"
            disablePortal
            strategy="fixed"
        >
            {children}
        </Popover>
    );
};
