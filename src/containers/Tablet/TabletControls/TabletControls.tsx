import {useEffect, useState} from 'react';
import {Button} from '@gravity-ui/uikit';

import {ETabletState, TTabletStateInfo} from '../../../types/api/tablet';
import {CriticalActionDialog} from '../../../components/CriticalActionDialog';

import i18n from '../i18n';
import {b} from '../Tablet';

enum EVisibleDialogType {
    'kill' = 'kill',
    'stop' = 'stop',
    'resume' = 'resume',
}

type VisibleDialogType = EVisibleDialogType | null;

interface TabletControlsProps {
    tablet: TTabletStateInfo;
    fetchData: VoidFunction;
}

export const TabletControls = ({tablet, fetchData}: TabletControlsProps) => {
    const {TabletId, HiveId} = tablet;

    const [isDialogVisible, setIsDialogVisible] = useState(false);
    const [visibleDialogType, setVisibleDialogType] = useState<VisibleDialogType>(null);
    const [isTabletActionLoading, setIsTabletActionLoading] = useState(false);

    // Enable controls after data update
    useEffect(() => {
        setIsTabletActionLoading(false);
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
        setIsTabletActionLoading(true);
        return window.api.killTablet(TabletId);
    };
    const _onStopClick = () => {
        setIsTabletActionLoading(true);
        return window.api.stopTablet(TabletId, HiveId);
    };
    const _onResumeClick = () => {
        setIsTabletActionLoading(true);
        return window.api.resumeTablet(TabletId, HiveId);
    };

    const hasHiveId = () => {
        return HiveId && HiveId !== '0';
    };

    const isDisabledResume =
        tablet.State !== ETabletState.Stopped && tablet.State !== ETabletState.Dead;

    const isDisabledStop =
        tablet.State === ETabletState.Stopped || tablet.State === ETabletState.Deleted;

    const renderDialog = () => {
        if (!isDialogVisible) {
            return null;
        }

        switch (visibleDialogType) {
            case EVisibleDialogType.kill: {
                return (
                    <CriticalActionDialog
                        visible={isDialogVisible}
                        text={i18n('dialog.kill')}
                        onClose={hideDialog}
                        onConfirm={_onKillClick}
                        onConfirmActionFinish={fetchData}
                    />
                );
            }
            case EVisibleDialogType.stop: {
                return (
                    <CriticalActionDialog
                        visible={isDialogVisible}
                        text={i18n('dialog.stop')}
                        onClose={hideDialog}
                        onConfirm={_onStopClick}
                        onConfirmActionFinish={fetchData}
                    />
                );
            }
            case EVisibleDialogType.resume: {
                return (
                    <CriticalActionDialog
                        visible={isDialogVisible}
                        text={i18n('dialog.resume')}
                        onClose={hideDialog}
                        onConfirm={_onResumeClick}
                        onConfirmActionFinish={fetchData}
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
                loading={isTabletActionLoading}
                className={b('control')}
            >
                {i18n('controls.kill')}
            </Button>
            {hasHiveId() ? (
                <>
                    <Button
                        onClick={showStopDialog}
                        view="action"
                        disabled={isDisabledStop}
                        loading={!isDisabledStop && isTabletActionLoading}
                        className={b('control')}
                    >
                        {i18n('controls.stop')}
                    </Button>
                    <Button
                        onClick={showResumeDialog}
                        view="action"
                        disabled={isDisabledResume}
                        loading={!isDisabledResume && isTabletActionLoading}
                        className={b('control')}
                    >
                        {i18n('controls.resume')}
                    </Button>
                </>
            ) : null}
            {renderDialog()}
        </div>
    );
};
