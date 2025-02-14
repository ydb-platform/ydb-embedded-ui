import {Button} from '@gravity-ui/uikit';

import {block} from '../constants';
import type {UnipikaFlattenTreeItem} from '../unipika/flattenUnipika';

interface ToggleCollapseProps {
    collapsed?: boolean;
    path?: UnipikaFlattenTreeItem['path'];
    onToggle: () => void;
}

export function ToggleCollapseButton(props: ToggleCollapseProps) {
    const {collapsed, onToggle, path} = props;
    return (
        <span title={path} className={block('collapsed')}>
            <Button onClick={onToggle} view="flat-secondary" size={'xs'}>
                <Button.Icon>
                    <span className={'unipika'}>{collapsed ? '[+]' : '[-]'}</span>
                </Button.Icon>
            </Button>
        </span>
    );
}
