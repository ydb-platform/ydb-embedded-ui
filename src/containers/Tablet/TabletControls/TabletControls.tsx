import {useEffect, useState} from 'react';
import {Button} from '@gravity-ui/uikit';

import {ETabletState, TTabletStateInfo} from '../../../types/api/tablet';
import {CriticalActionDialog} from '../../../components/CriticalActionDialog';

import {b} from '../Tablet';

enum EVisibleDialogType {
    'kill' = 'kill',
    'stop' = 'kill',
    'resume' = 'kill',
}

type VisibleDialogType = EVisibleDialogType | null;

interface TabletControlsProps {
    tablet: TTabletStateInfo;
}

export const TabletControls = ({tablet}: TabletControlsProps) => {
    const {TabletId, HiveId} = tablet;

    const [isDialogVisible, setIsDialogVisible] = useState(false);
    const [visibleDialogType, setVisibleDialogType] = useState<VisibleDialogType>(null);
    const [isTabletActionsDisabled, setIsTabletActionsDisabled] = useState(false);

    // Enable controls after data update
    useEffect(() => {
        setIsTabletActionsDisabled(false);
    }, [tablet]);

    const makeShowDialog = (type: VisibleDialogType) => () => {
        setIsDialogVisible(true);
        setVisibleDialogType(type);
    };

    const showKillDialog = makeShowDialog(EVisibleDialogType.kill);
    const showStopDialog = makeShowDialog(EVisibleDialogType.stop);
    const showResumeDialog = makeShowDialog(EVisibleDialogType.resume);

    const hideDialog = () => {
        setIsDialogVisible(false);
        setVisibleDialogType(null);
    };

    const _onKillClick = () => {
        setIsTabletActionsDisabled(true);
        return window.api.killTablet(TabletId);
    };
    const _onStopClick = () => {
        setIsTabletActionsDisabled(true);
        return window.api.stopTablet(TabletId, HiveId);
    };
    const _onResumeClick = () => {
        setIsTabletActionsDisabled(true);
        return window.api.resumeTablet(TabletId, HiveId);
    };

    const hasHiveId = () => {
        return HiveId && HiveId !== '0';
    };

    const isDisabledResume = () => {
        if (isTabletActionsDisabled) {
            return true;
        }

        return tablet.State !== ETabletState.Stopped && tablet.State !== ETabletState.Dead;
    };

    const isDisabledKill = () => {
        return isTabletActionsDisabled;
    };

    const isDisabledStop = () => {
        if (isTabletActionsDisabled) {
            return true;
        }

        return tablet.State === ETabletState.Stopped || tablet.State === ETabletState.Deleted;
    };

    const renderDialog = () => {
        if (!isDialogVisible) {
            return null;
        }

        switch (visibleDialogType) {
            case EVisibleDialogType.kill: {
                return (
                    <CriticalActionDialog
                        visible={isDialogVisible}
                        text="The tablet will be restarted. Do you want to proceed?"
                        onClose={hideDialog}
                        onConfirm={_onKillClick}
                    />
                );
            }
            case EVisibleDialogType.stop: {
                return (
                    <CriticalActionDialog
                        visible={isDialogVisible}
                        text="The tablet will be stopped. Do you want to proceed?"
                        onClose={hideDialog}
                        onConfirm={_onStopClick}
                    />
                );
            }
            case EVisibleDialogType.resume: {
                return (
                    <CriticalActionDialog
                        visible={isDialogVisible}
                        text="The tablet will be resumed. Do you want to proceed?"
                        onClose={hideDialog}
                        onConfirm={_onResumeClick}
                    />
                );
            }
            default:
                return null;
        }
    };

    return (
        <div className={b('controls')}>
            <Button
                onClick={showKillDialog}
                view="action"
                disabled={isDisabledKill()}
                className={b('control')}
            >
                Restart
            </Button>
            {hasHiveId() ? (
                <>
                    <Button
                        onClick={showStopDialog}
                        view="action"
                        disabled={isDisabledStop()}
                        className={b('control')}
                    >
                        Stop
                    </Button>
                    <Button
                        onClick={showResumeDialog}
                        view="action"
                        disabled={isDisabledResume()}
                        className={b('control')}
                    >
                        Resume
                    </Button>
                </>
            ) : null}
            {renderDialog()}
        </div>
    );
};
