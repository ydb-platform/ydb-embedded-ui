import {Flex, HelpMark, Label} from '@gravity-ui/uikit';

import {serverlessDBLabelKeyset} from './i18n';

export function ServerlessDBLabel({className}: {className?: string}) {
    return (
        <Label theme="clear" size="xs" className={className}>
            <Flex alignItems="center" gap="2">
                {serverlessDBLabelKeyset('value_serverless')}
                <HelpMark iconSize="s">
                    {serverlessDBLabelKeyset('context_serverless-tooltip')}
                </HelpMark>
            </Flex>
        </Label>
    );
}
