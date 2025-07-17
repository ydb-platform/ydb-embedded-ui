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

export interface VDiskBlobIndexResponse {
    /** Array of blob index statistics */
    BlobIndexStat?: VDiskBlobIndexItem[];
    /** Alternative possible field name (camelCase) */
    blobIndexStat?: VDiskBlobIndexItem[];
    /** Alternative possible field name (lowercase) */
    blobindexstat?: VDiskBlobIndexItem[];
    /** Response time */
    ResponseTime?: string;
    /** Response duration */
    ResponseDuration?: number;
    /** Alternative response structures */
    result?: VDiskBlobIndexItem[];
    data?: VDiskBlobIndexItem[];
    [key: string]: any; // Allow for other possible field names
}
