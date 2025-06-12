import {Button, Flex, Icon, Text} from '@gravity-ui/uikit';

import {
    TENANT_DIAGNOSTICS_TABS_IDS,
    TENANT_PAGES_IDS,
} from '../../../store/reducers/tenant/constants';
import {setDiagnosticsTab, setTenantPage} from '../../../store/reducers/tenant/tenant';
import {useTypedDispatch} from '../../../utils/hooks';

import i18n from './i18n';

import ArrowRightFromSquareIcon from '@gravity-ui/icons/svgs/arrow-right-from-square.svg';

export const Acl = () => {
    const dispatch = useTypedDispatch();

    return (
        <Flex gap={2} alignItems="center">
            <Text variant="body-2">{i18n('description_section-moved')}</Text>
            <Button
                title={i18n('action-open-in-diagnostics')}
                onClick={() => {
                    dispatch(setTenantPage(TENANT_PAGES_IDS.diagnostics));
                    dispatch(setDiagnosticsTab(TENANT_DIAGNOSTICS_TABS_IDS.access));
                }}
                size="s"
            >
                <Icon data={ArrowRightFromSquareIcon} size={14} />
            </Button>
        </Flex>
    );
};
