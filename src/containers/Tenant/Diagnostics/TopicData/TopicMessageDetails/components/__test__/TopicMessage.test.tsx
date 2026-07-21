import {fireEvent, render, screen} from '@testing-library/react';

import {createAndDownloadFile} from '../../../../../../../utils/downloadFile';
import {TopicMessage} from '../TopicMessage';

jest.mock('../../../../../../../utils/hooks', () => ({
    useTypedSelector: jest.fn(() => false),
}));

jest.mock('../../../../../../../utils/downloadFile', () => ({
    createAndDownloadFile: jest.fn(),
}));

const mockedCreateAndDownloadFile = createAndDownloadFile as jest.Mock;

describe('TopicMessage', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('downloads non-UTF-8 binary messages as raw bytes instead of a lossily-decoded string', () => {
        // base64 for bytes [0xff, 0xfe, 0x00, 0x61, 0x80] - not a valid UTF-8
        // sequence, so decoding it and re-downloading the decoded string would
        // silently corrupt the bytes (invalid sequences become U+FFFD).
        const base64Message = '//4AYYA=';

        render(<TopicMessage message={base64Message} offset={42} isSchematized={false} />);

        fireEvent.click(screen.getByRole('button', {name: 'Save message to file'}));

        expect(mockedCreateAndDownloadFile).toHaveBeenCalledTimes(1);
        const [data, fileName] = mockedCreateAndDownloadFile.mock.calls[0];

        expect(data).toBeInstanceOf(Uint8Array);
        expect(Array.from(data as Uint8Array)).toEqual([255, 254, 0, 97, 128]);
        expect(fileName).toBe('topic-message-42');
    });

    it('downloads plain UTF-8 text messages unchanged', () => {
        const base64Message = btoa('hello world');

        render(<TopicMessage message={base64Message} offset={7} isSchematized={false} />);

        fireEvent.click(screen.getByRole('button', {name: 'Save message to file'}));

        expect(mockedCreateAndDownloadFile).toHaveBeenCalledTimes(1);
        const [data, fileName] = mockedCreateAndDownloadFile.mock.calls[0];

        expect(Array.from(data as Uint8Array)).toEqual(
            Array.from(new TextEncoder().encode('hello world')),
        );
        expect(fileName).toBe('topic-message-7');
    });
});
