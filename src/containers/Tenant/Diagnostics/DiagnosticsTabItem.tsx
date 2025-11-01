import type {LabelProps} from '@gravity-ui/uikit';
import {Label, Tab} from '@gravity-ui/uikit';

import {InternalLink} from '../../../components/InternalLink';
import {cn} from '../../../utils/cn';

const b = cn('kv-tenant-diagnostics');

interface DiagnosticsTabItemProps {
    id: string;
    title: string;
    linkPath: string;
    badge?: {
        text: string;
        theme?: LabelProps['theme'];
        size?: LabelProps['size'];
    };
}

export function DiagnosticsTabItem({id, title, linkPath, badge}: DiagnosticsTabItemProps) {
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
