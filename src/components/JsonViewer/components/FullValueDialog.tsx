import {Dialog, Flex} from '@gravity-ui/uikit';

import {block} from '../constants';
import i18n from '../i18n';
import {getHightLightedClassName} from '../utils';

import {MultiHighlightedText} from './HighlightedText';

interface FullValueDialogProps {
    onClose: () => void;
    length: number;
    text: string;
    starts: number[];
}

export function FullValueDialog({onClose, text, starts, length}: FullValueDialogProps) {
    //if dialog opens from Drawer, outside click should not close Drawer
    const handleClickOutside = (e: MouseEvent) => {
        e.stopPropagation();
    };
    return (
        <Dialog open={true} onClose={onClose} onOutsideClick={handleClickOutside}>
            <Dialog.Header caption={i18n('description_full-value')} />
            <Dialog.Divider />
            <Dialog.Body>
                <Flex direction="column" gap={2} width="70vw" maxHeight="80vh">
                    <div className={block('full-value')}>
                        <MultiHighlightedText
                            className={getHightLightedClassName()}
                            starts={starts}
                            text={text}
                            length={length}
                        />
                    </div>
                </Flex>
            </Dialog.Body>
        </Dialog>
    );
}
