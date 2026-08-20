import React from 'react';

import {Popover, Tab, TabList, TabPanel, TabProvider} from '@gravity-ui/uikit';

import type {
    TopologyNodeDataStatsItem,
    TopologyNodeDataStatsSection,
} from '../../store/reducers/query/types';
import {cn} from '../../utils/cn';

import type {ExtendedTBlock} from './types';

const b = cn('ydb-gravity-graph');
type Props = {
    block: ExtendedTBlock;
    children: React.ReactElement<React.HTMLAttributes<HTMLElement>>;
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
    const [activeTab, setActiveTab] = React.useState(firstTab);
    const validatedActiveTab = block.stats?.some(({group}) => group === activeTab)
        ? activeTab
        : firstTab;

    React.useEffect(() => {
        if (activeTab !== validatedActiveTab) {
            setActiveTab(validatedActiveTab);
        }
    }, [activeTab, validatedActiveTab]);

    return React.useMemo(
        () => (
            <TabProvider value={validatedActiveTab} onUpdate={setActiveTab}>
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
        ),
        [block?.stats, validatedActiveTab],
    );
};

export const TooltipComponent = ({block, children}: Props) => {
    const content = useTooltipContent(block);
    const trigger = React.cloneElement(children, {
        role: children.props.role ?? 'button',
        tabIndex: children.props.tabIndex ?? 0,
        onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
            children.props.onKeyDown?.(event);
            if (event.defaultPrevented) {
                return;
            }

            if (event.key === 'Enter') {
                event.preventDefault();
                event.currentTarget.click();
            } else if (event.key === ' ') {
                event.preventDefault();
            }
        },
        onKeyUp: (event: React.KeyboardEvent<HTMLElement>) => {
            children.props.onKeyUp?.(event);
            if (!event.defaultPrevented && event.key === ' ') {
                event.currentTarget.click();
            }
        },
    });

    return (
        <Popover
            content={content}
            hasArrow
            trigger="click"
            placement="right-start"
            className="ydb-gravity-graph__tooltip-content"
            strategy="fixed"
        >
            {trigger}
        </Popover>
    );
};
