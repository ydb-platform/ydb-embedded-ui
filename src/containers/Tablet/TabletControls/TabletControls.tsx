import React from 'react';

import {ButtonWithConfirmDialog} from '../../../components/ButtonWithConfirmDialog/ButtonWithConfirmDialog';
import {ETabletState} from '../../../types/api/tablet';
import type {TTabletStateInfo} from '../../../types/api/tablet';
import {useTypedSelector} from '../../../utils/hooks';
import {b} from '../Tablet';
import i18n from '../i18n';

interface TabletControlsProps {
    tablet: TTabletStateInfo;
    fetchData: () => Promise<unknown>;
}

export const TabletControls = ({tablet, fetchData}: TabletControlsProps) => {
    const {TabletId, HiveId} = tablet;

    const {isUserAllowedToMakeChanges} = useTypedSelector((state) => state.authentication);

    const _onKillClick = () => {
        return window.api.killTablet(TabletId);
    };
    const _onStopClick = () => {
        return window.api.stopTablet(TabletId, HiveId);
    };
    const _onResumeClick = () => {
        return window.api.resumeTablet(TabletId, HiveId);
    };

    const hasHiveId = () => {
        return HiveId && HiveId !== '0';
    };

    const isDisabledRestart = tablet.State === ETabletState.Stopped;

    const isDisabledResume =
        tablet.State !== ETabletState.Stopped && tablet.State !== ETabletState.Dead;

    const isDisabledStop =
        tablet.State === ETabletState.Stopped || tablet.State === ETabletState.Deleted;

    return (
        <div className={b('controls')}>
            <ButtonWithConfirmDialog
                dialogContent={i18n('dialog.kill')}
                onConfirmAction={_onKillClick}
                onConfirmActionSuccess={fetchData}
                buttonClassName={b('control')}
                buttonDisabled={isDisabledRestart || !isUserAllowedToMakeChanges}
                withPopover={true}
                popoverContent={i18n('controls.kill-not-allowed')}
                popoverPlacement={'bottom'}
                popoverDisabled={isUserAllowedToMakeChanges}
            >
                {i18n('controls.kill')}
            </ButtonWithConfirmDialog>
            {hasHiveId() ? (
                <React.Fragment>
                    <ButtonWithConfirmDialog
                        dialogContent={i18n('dialog.stop')}
                        onConfirmAction={_onStopClick}
                        onConfirmActionSuccess={fetchData}
                        buttonClassName={b('control')}
                        buttonDisabled={isDisabledStop || !isUserAllowedToMakeChanges}
                        withPopover={true}
                        popoverContent={i18n('controls.stop-not-allowed')}
                        popoverPlacement={'bottom'}
                        popoverDisabled={isUserAllowedToMakeChanges}
                    >
                        {i18n('controls.stop')}
                    </ButtonWithConfirmDialog>
                    <ButtonWithConfirmDialog
                        dialogContent={i18n('dialog.resume')}
                        onConfirmAction={_onResumeClick}
                        onConfirmActionSuccess={fetchData}
                        buttonClassName={b('control')}
                        buttonDisabled={isDisabledResume || !isUserAllowedToMakeChanges}
                        withPopover={true}
                        popoverContent={i18n('controls.resume-not-allowed')}
                        popoverPlacement={'bottom'}
                        popoverDisabled={isUserAllowedToMakeChanges}
                    >
                        {i18n('controls.resume')}
                    </ButtonWithConfirmDialog>
                </React.Fragment>
            ) : null}
        </div>
    );
};
