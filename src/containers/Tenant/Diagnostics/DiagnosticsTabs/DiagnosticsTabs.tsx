import {Label, Tab, TabList, TabProvider} from '@gravity-ui/uikit';

import {AutoRefreshControl} from '../../../../components/AutoRefreshControl/AutoRefreshControl';
import {InternalLink} from '../../../../components/InternalLink';
import {cn} from '../../../../utils/cn';
import type {Page} from '../DiagnosticsPages';
import {useDiagnosticsPageLinkGetter} from '../DiagnosticsPages';

import './DiagnosticsTabs.scss';

const b = cn('ydb-database-diagnostics-tabs');

interface DiagnosticsTabsProps {
    activeTab: Page;
    tabs: Page[];
}

export function DiagnosticsTabs({activeTab, tabs}: DiagnosticsTabsProps) {
    const getDiagnosticsPageLink = useDiagnosticsPageLinkGetter();

    return (
        <div className={b('header-wrapper')}>
            <div className={b('tabs')}>
                <TabProvider value={activeTab?.id}>
                    <TabList size="l">
                        {tabs.map(({id, title, badge}) => (
                            <DiagnosticsTabItem
                                key={id}
                                id={id}
                                title={title}
                                linkPath={getDiagnosticsPageLink(id)}
                                badge={badge}
                            />
                        ))}
                    </TabList>
                </TabProvider>
                <AutoRefreshControl />
            </div>
        </div>
    );
}

interface DiagnosticsTabItemProps extends Page {
    linkPath: string;
}

function DiagnosticsTabItem({id, title, linkPath, badge}: DiagnosticsTabItemProps) {
    return (
        <Tab key={id} value={id}>
            <InternalLink to={linkPath} as="tab">
                {title}
                {badge && (
                    <Label className={b('tab-badge')} theme={badge.theme} size={badge.size}>
                        {badge.text}
                    </Label>
                )}
            </InternalLink>
        </Tab>
    );
}
