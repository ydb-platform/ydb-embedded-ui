import {Gear} from '@gravity-ui/icons';
import type {TableColumnSetupProps as TableColumnSetupPropsUikit} from '@gravity-ui/uikit';
import {Button, Icon, TableColumnSetup as TableColumnSetupUikit, Text} from '@gravity-ui/uikit';

interface TableColumnSetupProps extends Omit<TableColumnSetupPropsUikit, 'renderSwitcher'> {}

export function TableColumnSetup(props: TableColumnSetupProps) {
    const {items, showStatus, disabled} = props;
    const renderStatus = () => {
        if (!showStatus) {
            return null;
        }
        const selected = items.reduce((acc, cur) => (cur.selected ? acc + 1 : acc), 0);
        const all = items.length;
        const status = (
            <Text color="secondary">
                {selected}/{all}
            </Text>
        );

        return status;
    };
    const renderSwitcher: TableColumnSetupPropsUikit['renderSwitcher'] = (switcherProps) => {
        return (
            <Button disabled={disabled} onClick={switcherProps.onClick}>
                <Icon data={Gear} />
                {renderStatus()}
            </Button>
        );
    };

    return <TableColumnSetupUikit {...props} renderSwitcher={renderSwitcher} hideApplyButton />;
}
