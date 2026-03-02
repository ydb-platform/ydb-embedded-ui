import {Flex, Text} from '@gravity-ui/uikit';

import {cn} from '../../../utils/cn';
import {ClipboardButton} from '../../ClipboardButton/ClipboardButton';

import './ResponseBodySection.scss';

const b = cn('response-body-section');

interface ResponseBodySectionProps {
    body: string;
}

function detectLanguageLabel(body: string): string | undefined {
    const trimmed = body.trimStart();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        return 'JSON';
    }
    if (trimmed.startsWith('<')) {
        return 'HTML';
    }
    return undefined;
}

export function ResponseBodySection({body}: ResponseBodySectionProps) {
    const languageLabel = detectLanguageLabel(body);

    return (
        <div className={b()}>
            <Flex className={b('header')} alignItems="center" justifyContent="space-between">
                {languageLabel && (
                    <Text variant="body-1" color="secondary" className={b('language')}>
                        {languageLabel}
                    </Text>
                )}
                <ClipboardButton
                    copyText={body}
                    size="s"
                    className={b('copy-button')}
                    withLabel={false}
                />
            </Flex>
            <div className={b('content')}>
                <Text variant="code-1" className={b('code')}>
                    {body}
                </Text>
            </div>
        </div>
    );
}
