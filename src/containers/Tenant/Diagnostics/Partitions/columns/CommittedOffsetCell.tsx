import React from 'react';

import {
    ArrowLeftToLine,
    ArrowRightToLine,
    ArrowsExpandHorizontal,
    ChevronsRight,
    PencilToLine,
} from '@gravity-ui/icons';
import type {DropdownMenuItem} from '@gravity-ui/uikit';
import {ActionTooltip, Button, DropdownMenu, Icon} from '@gravity-ui/uikit';

import {partitionsApi} from '../../../../../store/reducers/partitions/partitions';
import {cn} from '../../../../../utils/cn';
import createToast from '../../../../../utils/createToast';
import {prepareCommonErrorMessage} from '../../../../../utils/errors';
import {useTypedSelector} from '../../../../../utils/hooks';
import {useCurrentSchema} from '../../../TenantContext';
import i18n from '../i18n';
import {showMoveOffsetConfirmation} from '../utils/showMoveOffsetConfirmation';
import {showSpecifyOffsetConfirmation} from '../utils/showSpecifyOffsetConfirmation';

const b = cn('ydb-diagnostics-partitions-columns');

interface CommittedOffsetCellProps {
    value?: string;
    startOffset: string;
    endOffset: string;
    partitionId: string | number;
    readSessionId?: string;
}

export function CommittedOffsetCell({
    value,
    startOffset,
    endOffset,
    partitionId,
    readSessionId,
}: CommittedOffsetCellProps) {
    const {path, database} = useCurrentSchema();
    const {selectedConsumer} = useTypedSelector((state) => state.partitions);
    const [commitOffset] = partitionsApi.useCommitOffsetMutation();

    const handleCommitOffset = React.useCallback(
        (offset: number) => {
            if (!selectedConsumer) {
                return;
            }
            commitOffset({
                database,
                path,
                consumer: selectedConsumer,
                partitionId: Number(partitionId),
                offset,
                readSessionId,
            })
                .unwrap()
                .then(() => {
                    createToast({
                        name: 'commitOffset',
                        content: i18n('alert_offset-moved'),
                        theme: 'success',
                        title: '',
                    });
                })
                .catch((err: unknown) => {
                    createToast({
                        name: 'commitOffset',
                        title: i18n('alert_offset-error'),
                        content: prepareCommonErrorMessage(err),
                        theme: 'danger',
                    });
                });
        },
        [commitOffset, database, path, selectedConsumer, partitionId, readSessionId],
    );

    const committedOffsetMenuItems: DropdownMenuItem[][] = React.useMemo(
        () => [
            [
                {
                    action: () => {
                        if (selectedConsumer) {
                            showMoveOffsetConfirmation({
                                confirmMessage: i18n('confirm_move-offset-to-start', {
                                    partitionId: String(partitionId),
                                    consumer: selectedConsumer,
                                }),
                                alertMessage: i18n('alert_move-offset-to-start'),
                                onConfirm: () => {
                                    handleCommitOffset(Number(startOffset));
                                },
                            });
                        }
                    },
                    text: i18n('action_to-start'),
                    iconStart: <Icon data={ArrowLeftToLine} size={14} />,
                },
                {
                    action: () => {
                        if (selectedConsumer) {
                            showMoveOffsetConfirmation({
                                confirmMessage: i18n('confirm_move-offset-to-end', {
                                    partitionId: String(partitionId),
                                    consumer: selectedConsumer,
                                }),
                                alertMessage: i18n('alert_move-offset-forward'),
                                onConfirm: () => {
                                    handleCommitOffset(Number(endOffset));
                                },
                            });
                        }
                    },
                    text: i18n('action_to-end'),
                    iconStart: <Icon data={ArrowRightToLine} size={14} />,
                },
            ],
            [
                {
                    action: () => {
                        if (selectedConsumer && value !== undefined) {
                            showMoveOffsetConfirmation({
                                confirmMessage: i18n('confirm_skip-message', {
                                    partitionId: String(partitionId),
                                    consumer: selectedConsumer,
                                }),
                                alertMessage: i18n('alert_move-offset-forward'),
                                onConfirm: () => {
                                    handleCommitOffset(Number(value) + 1);
                                },
                            });
                        }
                    },
                    text: i18n('action_skip-message'),
                    iconStart: <Icon data={ChevronsRight} size={14} />,
                    disabled: value === undefined,
                },
            ],
            [
                {
                    action: () => {
                        if (selectedConsumer) {
                            showSpecifyOffsetConfirmation({
                                partitionId,
                                consumer: selectedConsumer,
                                onConfirm: handleCommitOffset,
                            });
                        }
                    },
                    text: i18n('action_specify-offset'),
                    iconStart: <Icon data={PencilToLine} size={14} />,
                },
            ],
        ],
        [handleCommitOffset, selectedConsumer, partitionId, startOffset, endOffset, value],
    );

    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    const handleOpenToggle = React.useCallback((open: boolean) => {
        setIsMenuOpen(open);
    }, []);

    const renderSwitcher = React.useCallback(
        (props: React.ComponentPropsWithoutRef<typeof Button>) => (
            <ActionTooltip title={i18n('context_move-offset')} placement={['right']}>
                <Button
                    {...props}
                    view="flat-secondary"
                    className={b('committed-offset-switcher', {open: isMenuOpen})}
                >
                    <Icon data={ArrowsExpandHorizontal} />
                </Button>
            </ActionTooltip>
        ),
        [isMenuOpen],
    );

    return (
        <div className={b('committed-offset-cell')}>
            <span>{value}</span>

            <DropdownMenu
                items={committedOffsetMenuItems}
                renderSwitcher={renderSwitcher}
                onOpenToggle={handleOpenToggle}
                popupProps={{placement: 'bottom-end'}}
                menuProps={{size: 's'}}
            />
        </div>
    );
}
