import type {NavigationTreeProps} from 'ydb-ui-components';

export type DropdownItem = {
    text: string;
    action: () => void;
    iconEnd?: React.ReactNode;
};

export type TreeNodeMeta = {
    subType?: string;
};

export type YdbNavigationTreeProps = NavigationTreeProps<DropdownItem, TreeNodeMeta | undefined>;
