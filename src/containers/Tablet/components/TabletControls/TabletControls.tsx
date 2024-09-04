import React from 'react';

import {ArrowRotateLeft, StopFill, TriangleRightFill} from '@gravity-ui/icons';
import {Flex, Icon} from '@gravity-ui/uikit';

import {ButtonWithConfirmDialog} from '../../../../components/ButtonWithConfirmDialog/ButtonWithConfirmDialog';
import {selectIsUserAllowedToMakeChanges} from '../../../../store/reducers/authentication/authentication';
import {tabletApi} from '../../../../store/reducers/tablet';
import {ETabletState} from '../../../../types/api/tablet';
import type {TTabletStateInfo} from '../../../../types/api/tablet';
import {useTypedSelector} from '../../../../utils/hooks';
import i18n from '../../i18n';
import {hasHive} from '../../utils';

interface TabletControlsProps {
    tablet: TTabletStateInfo;
}

export const TabletControls = ({tablet}: TabletControlsProps) => {
    const {TabletId, HiveId} = tablet;

    const isUserAllowedToMakeChanges = useTypedSelector(selectIsUserAllowedToMakeChanges);

    const [killTablet] = tabletApi.useKillTabletMutation();
    const [stopTablet] = tabletApi.useStopTabletMutation();
    const [resumeTablet] = tabletApi.useResumeTabletMutation();

    if (!TabletId) {
        return null;
    }

    const hasHiveId = hasHive(HiveId);

    const isDisabledRestart = tablet.State === ETabletState.Stopped;

    const isDisabledResume =
        tablet.State !== ETabletState.Stopped && tablet.State !== ETabletState.Dead;

    const isDisabledStop =
        tablet.State === ETabletState.Stopped || tablet.State === ETabletState.Deleted;

    return (
        <Flex gap={2} wrap="nowrap">
            <ButtonWithConfirmDialog
                dialogHeader={i18n('dialog.kill-header')}
                dialogText={i18n('dialog.kill-text')}
                onConfirmAction={() => killTablet({id: TabletId}).unwrap()}
                buttonDisabled={isDisabledRestart || !isUserAllowedToMakeChanges}
                withPopover
                buttonView="normal"
                popoverContent={i18n('controls.kill-not-allowed')}
                popoverPlacement={'bottom'}
                popoverDisabled={isUserAllowedToMakeChanges}
            >
                <Icon data={ArrowRotateLeft} />
                {i18n('controls.kill')}
            </ButtonWithConfirmDialog>
            {hasHiveId && (
                <React.Fragment>
                    <ButtonWithConfirmDialog
                        dialogHeader={i18n('dialog.stop-header')}
                        dialogText={i18n('dialog.stop-text')}
                        onConfirmAction={() => stopTablet({id: TabletId, hiveId: HiveId}).unwrap()}
                        buttonDisabled={isDisabledStop || !isUserAllowedToMakeChanges}
                        withPopover
                        buttonView="normal"
                        popoverContent={i18n('controls.stop-not-allowed')}
                        popoverPlacement={'bottom'}
                        popoverDisabled={isUserAllowedToMakeChanges}
                    >
                        <Icon data={StopFill} />
                        {i18n('controls.stop')}
                    </ButtonWithConfirmDialog>
                    <ButtonWithConfirmDialog
                        dialogHeader={i18n('dialog.resume-header')}
                        dialogText={i18n('dialog.resume-text')}
                        onConfirmAction={() =>
                            resumeTablet({id: TabletId, hiveId: HiveId}).unwrap()
                        }
                        buttonDisabled={isDisabledResume || !isUserAllowedToMakeChanges}
                        withPopover
                        buttonView="normal"
                        popoverContent={i18n('controls.resume-not-allowed')}
                        popoverPlacement={'bottom'}
                        popoverDisabled={isUserAllowedToMakeChanges}
                    >
                        <Icon data={TriangleRightFill} />
                        {i18n('controls.resume')}
                    </ButtonWithConfirmDialog>
                </React.Fragment>
            )}
        </Flex>
    );
};
