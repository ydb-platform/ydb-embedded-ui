import {ETabletState, type TTabletStateInfo} from '../../../types/api/tablet';
import type {ITabletHandledResponse} from '../../../types/store/tablet';
import {ButtonWithConfirmDialog} from '../../../components/ButtonWithConfirmDialog/ButtonWithConfirmDialog';

import i18n from '../i18n';
import {b} from '../Tablet';

interface TabletControlsProps {
    tablet: TTabletStateInfo;
    fetchData: () => Promise<ITabletHandledResponse | undefined>;
}

export const TabletControls = ({tablet, fetchData}: TabletControlsProps) => {
    const {TabletId, HiveId} = tablet;

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
                buttonDisabled={isDisabledRestart}
            >
                {i18n('controls.kill')}
            </ButtonWithConfirmDialog>
            {hasHiveId() ? (
                <>
                    <ButtonWithConfirmDialog
                        dialogContent={i18n('dialog.stop')}
                        onConfirmAction={_onStopClick}
                        onConfirmActionSuccess={fetchData}
                        buttonClassName={b('control')}
                        buttonDisabled={isDisabledStop}
                    >
                        {i18n('controls.stop')}
                    </ButtonWithConfirmDialog>
                    <ButtonWithConfirmDialog
                        dialogContent={i18n('dialog.resume')}
                        onConfirmAction={_onResumeClick}
                        onConfirmActionSuccess={fetchData}
                        buttonClassName={b('control')}
                        buttonDisabled={isDisabledResume}
                    >
                        {i18n('controls.resume')}
                    </ButtonWithConfirmDialog>
                </>
            ) : null}
        </div>
    );
};
