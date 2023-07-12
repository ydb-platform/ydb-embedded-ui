import type {TPathID} from './shared';

export interface TCdcStreamDescription {
    Name?: string;
    Mode?: ECdcStreamMode;
    Format?: ECdcStreamFormat;
    PathId?: TPathID;
    State?: ECdcStreamState;
    /** uint64 */
    SchemaVersion?: string;
}

enum ECdcStreamMode {
    ECdcStreamModeInvalid = 'ECdcStreamModeInvalid',
    ECdcStreamModeKeysOnly = 'ECdcStreamModeKeysOnly',
    ECdcStreamModeUpdate = 'ECdcStreamModeUpdate',
    ECdcStreamModeNewImage = 'ECdcStreamModeNewImage',
    ECdcStreamModeOldImage = 'ECdcStreamModeOldImage',
    ECdcStreamModeNewAndOldImages = 'ECdcStreamModeNewAndOldImages',
}

enum ECdcStreamFormat {
    ECdcStreamFormatInvalid = 'ECdcStreamFormatInvalid',
    ECdcStreamFormatProto = 'ECdcStreamFormatProto',
    ECdcStreamFormatJson = 'ECdcStreamFormatJson',
}

enum ECdcStreamState {
    ECdcStreamStateInvalid = 'ECdcStreamStateInvalid',
    ECdcStreamStateReady = 'ECdcStreamStateReady',
    ECdcStreamStateDisabled = 'ECdcStreamStateDisabled',
}
