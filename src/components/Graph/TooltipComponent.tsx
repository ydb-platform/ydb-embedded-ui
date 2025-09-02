import React, { useState, useMemo } from 'react';
import type { TBlock } from '@gravity-ui/graph';
import { Text, Popover, TabProvider, TabList, Tab, TabPanel } from '@gravity-ui/uikit';

type Props = {
    block: TBlock;
    children: React.ReactNode;
};

const getTooltipContent = (block: TBlock) => {
    const [activeTab, setActiveTab] = useState(block?.stats[0]?.group);

    return (
        <TabProvider value={activeTab} onUpdate={setActiveTab}>
            <TabList>
                {block?.stats?.map((item) => <Tab value={item.group}>{item.group}</Tab>)}
            </TabList>
            {block?.stats?.map((item) => <TabPanel value={item.group}>
                {item.stats?.map((stat) => <div key={stat.name}>
                    {Boolean(stat.items) && 
                        <>
                            <strong>{stat.name}</strong>
                            {stat.items?.map(({ name, value }) => <div key={value}>{name}: {value}</div>)}
                        </>
                    }
                    {!stat.items && <div>{stat.name}: {stat.value}</div>}

                    
                </div>)}
            </TabPanel>)}
        </TabProvider>
    );
}

export const TooltipComponent = ({ block, children }: Props) => {
    return (
        <Popover content={getTooltipContent(block)}
            hasArrow
            trigger='click'
            placement='right-start'
            className='ydb-gravity-graph__tooltip-content'
            disablePortal
            strategy='fixed'>
            {children}
        </Popover>
    );
};
