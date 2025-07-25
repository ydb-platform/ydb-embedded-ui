import {Flex, HelpMark} from '@gravity-ui/uikit';

interface TitleWithHelpMarkProps {
    header: string;
    note: string;
}

export function TitleWithHelpMark({header, note}: TitleWithHelpMarkProps) {
    return (
        <Flex gap={1} alignItems="center">
            {header}
            <HelpMark popoverProps={{placement: ['right', 'left']}}>{note}</HelpMark>
        </Flex>
    );
}
