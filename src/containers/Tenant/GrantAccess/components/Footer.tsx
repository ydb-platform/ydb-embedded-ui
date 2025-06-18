import {TriangleExclamationFill} from '@gravity-ui/icons';
import {ActionTooltip, Button, Flex, Icon, Label} from '@gravity-ui/uikit';

import i18n from '../i18n';
import {block} from '../shared';

interface FooterProps {
    onCancel: () => void;
    onSave: () => void;
    onDiscard: () => void;
    loading?: boolean;
    error?: string;
    disabled?: boolean;
}

export function Footer({onCancel, onSave, onDiscard, loading, error, disabled}: FooterProps) {
    return (
        <Flex justifyContent="space-between" gap={2} className={block('footer')}>
            <Button
                view="outlined"
                onClick={onDiscard}
                size="l"
                className={block('footer-button')}
                disabled={disabled}
            >
                {i18n('action_discard')}
            </Button>

            <Flex gap={2} alignItems="center">
                {error && (
                    <ActionTooltip title={error}>
                        <Label
                            size="m"
                            theme="danger"
                            icon={<Icon data={TriangleExclamationFill} />}
                        >
                            {i18n('description_failed')}
                        </Label>
                    </ActionTooltip>
                )}
                <Button view="flat" onClick={onCancel} size="l" className={block('footer-button')}>
                    {i18n('action_cancel')}
                </Button>
                <Button
                    onClick={onSave}
                    view="action"
                    size="l"
                    className={block('footer-button')}
                    loading={loading}
                    disabled={disabled}
                >
                    {i18n('action_save')}
                </Button>
            </Flex>
        </Flex>
    );
}
