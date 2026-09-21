import {Flex, Label} from '@gravity-ui/uikit';

import i18n from '../i18n';

export function DriveTypeLegend() {
    return (
        <Flex gap={2} alignItems="center" wrap="wrap">
            <Label size="xs" theme="normal">
                SSD
            </Label>
            <Label size="xs" theme="utility">
                HDD
            </Label>
            <Label size="xs" theme="info">
                NVME
            </Label>
            <Label size="xs" theme="unknown">
                {i18n('value_no-data')}
            </Label>
        </Flex>
    );
}
