import type {AxiosResponse} from 'axios';

import {BaseYdbAPI} from './base';
import type {AxiosOptions} from './base';

interface MultipartChunk<T = any> {
    part_number: number;
    total_parts: number;
    content: T;
    result?: string;
}

export class MultipartAPI extends BaseYdbAPI {
    async streamMultipartResponse<T>(
        url: string,
        params: Record<string, any> = {},
        options: AxiosOptions = {},
    ): Promise<MultipartChunk<T>[]> {
        const response = await this._axios.get<string>(this.getPath(url), {
            params,
            ...options,
            headers: {
                Accept: 'multipart/x-mixed-replace',
            },
            responseType: 'text',
            transformResponse: (data) => data, // Prevent default JSON parsing
        });

        return this.parseMultipartResponse<T>(response);
    }

    private parseMultipartResponse<T>(response: AxiosResponse<string>): MultipartChunk<T>[] {
        const contentType = response.headers['content-type'];
        const boundaryMatch = contentType.match(/boundary=([^;]+)/);

        if (!boundaryMatch) {
            throw new Error('No boundary found in multipart response');
        }

        const boundary = boundaryMatch[1];
        const parts = response.data.split(`--${boundary}`);
        const chunks: MultipartChunk<T>[] = [];

        // Process each part except first (usually empty) and last (boundary terminator)
        for (const part of parts.slice(1, -1)) {
            const lines = part.split('\n').filter(Boolean);
            const jsonStartIndex = lines.findIndex((line) => line.trim().startsWith('{'));

            if (jsonStartIndex !== -1) {
                try {
                    const jsonContent = lines.slice(jsonStartIndex).join('\n');
                    const chunk = JSON.parse(jsonContent) as MultipartChunk<T>;
                    chunks.push(chunk);
                } catch (error) {
                    console.error('Failed to parse chunk:', error);
                }
            }
        }

        return chunks;
    }
}

// Create and export a singleton instance
export const multipartAPI = new MultipartAPI();
