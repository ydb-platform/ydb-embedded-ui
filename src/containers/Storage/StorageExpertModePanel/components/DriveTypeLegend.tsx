import {Flex, Label} from '@gravity-ui/uikit';

import i18n from '../i18n';

export function DriveTypeLegend() {
    return (
        <Flex gap={2} alignItems="center" wrap="wrap">
            <Label size="xs" theme="normal">
                {i18n('value_ssd')}
            </Label>
            <Label size="xs" theme="utility">
                {i18n('value_hdd')}
            </Label>
            <Label size="xs" theme="info">
                {i18n('value_nvme')}
            </Label>
            <Label size="xs" theme="unknown">
                {i18n('value_no-data')}
            </Label>
        </Flex>
    );
}
