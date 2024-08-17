import React from 'react';

import {ArrowRotateLeft, StopFill, TriangleRightFill} from '@gravity-ui/icons';
import {Flex, Icon} from '@gravity-ui/uikit';

import {ButtonWithConfirmDialog} from '../../../../components/ButtonWithConfirmDialog/ButtonWithConfirmDialog';
import {selectIsUserAllowedToMakeChanges} from '../../../../store/reducers/authentication/authentication';
import {ETabletState} from '../../../../types/api/tablet';
import type {TTabletStateInfo} from '../../../../types/api/tablet';
import {useTypedSelector} from '../../../../utils/hooks';
import i18n from '../../i18n';

interface TabletControlsProps {
    tablet: TTabletStateInfo;
    fetchData: () => Promise<unknown>;
}

export const TabletControls = ({tablet, fetchData}: TabletControlsProps) => {
    const {TabletId, HiveId} = tablet;

    const isUserAllowedToMakeChanges = useTypedSelector(selectIsUserAllowedToMakeChanges);

    const _onKillClick = () => {
        return window.api.killTablet(TabletId);
    };
    const _onStopClick = () => {
        return window.api.stopTablet(TabletId, HiveId);
    };
    const _onResumeClick = () => {
        return window.api.resumeTablet(TabletId, HiveId);
    };

    const hasHiveId = HiveId && HiveId !== '0';

    const isDisabledRestart = tablet.State === ETabletState.Stopped;

    const isDisabledResume =
        tablet.State !== ETabletState.Stopped && tablet.State !== ETabletState.Dead;

    const isDisabledStop =
        tablet.State === ETabletState.Stopped || tablet.State === ETabletState.Deleted;

    return (
        <Flex gap={2} wrap="nowrap">
            <ButtonWithConfirmDialog
                dialogContent={i18n('dialog.kill')}
                onConfirmAction={_onKillClick}
                onConfirmActionSuccess={fetchData}
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
                        dialogContent={i18n('dialog.stop')}
                        onConfirmAction={_onStopClick}
                        onConfirmActionSuccess={fetchData}
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
                        dialogContent={i18n('dialog.resume')}
                        onConfirmAction={_onResumeClick}
                        onConfirmActionSuccess={fetchData}
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
