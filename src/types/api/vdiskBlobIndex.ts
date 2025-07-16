/**
 * VDisk Blob Index Statistics API types
 *
 * endpoint: /vdisk/blobindexstat
 */

export interface VDiskBlobIndexItem {
    /** Tablet ID */
    TabletId?: string | number;
    /** Channel ID */
    ChannelId?: number;
    /** Count */
    Count?: number;
    /** Size in bytes */
    Size?: number | string;
}

export interface VDiskBlobIndexResponse {
    /** Array of blob index statistics */
    BlobIndexStat?: VDiskBlobIndexItem[];
    /** Response time */
    ResponseTime?: string;
    /** Response duration */
    ResponseDuration?: number;
}
