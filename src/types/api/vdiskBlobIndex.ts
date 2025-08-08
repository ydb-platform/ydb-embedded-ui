/**
 * VDisk Blob Index Statistics API types
 *
 * endpoint: /vdisk/blobindexstat
 */

export interface VDiskBlobIndexItem {
    /** Tablet ID */
    TabletId?: string | number;
    /** Alternative field name for Tablet ID */
    tabletId?: string | number;
    /** Channel ID */
    ChannelId?: number;
    /** Alternative field name for Channel ID */
    channelId?: number;
    /** Count */
    Count?: number;
    /** Alternative field name for Count */
    count?: number;
    /** Size in bytes */
    Size?: number | string;
    /** Alternative field name for Size */
    size?: number | string;
    /** Allow for other possible field names */
    [key: string]: any;
}

export interface VDiskBlobIndexChannel {
    /** Channel count */
    count?: string;
    /** Channel data size */
    data_size?: string;
    /** Channel minimum ID */
    min_id?: string;
    /** Channel maximum ID */
    max_id?: string;
}

export interface VDiskBlobIndexTablet {
    /** Tablet identifier */
    tablet_id?: string;
    /** Array of tablet channels */
    channels?: VDiskBlobIndexChannel[];
}

export interface VDiskBlobIndexStat {
    /** Array of tablets */
    tablets?: VDiskBlobIndexTablet[];
    /** Array of channels */
    channels?: VDiskBlobIndexChannel[];
}

export interface VDiskBlobIndexResponse {
    /** Response status */
    status?: string;
    /** Statistics data */
    stat?: VDiskBlobIndexStat;
    /** Response time */
    ResponseTime?: string;
    /** Response duration */
    ResponseDuration?: number;
    /** Alternative response structures for backward compatibility */
    BlobIndexStat?: VDiskBlobIndexItem[];
    blobIndexStat?: VDiskBlobIndexItem[];
    blobindexstat?: VDiskBlobIndexItem[];
    result?: VDiskBlobIndexItem[];
    data?: VDiskBlobIndexItem[];
    [key: string]: any; // Allow for other possible field names
}
