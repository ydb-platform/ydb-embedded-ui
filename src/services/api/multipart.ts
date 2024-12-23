import {BaseYdbAPI} from './base';
import type {AxiosOptions} from './base';

interface MultipartChunk<T = any> {
    part_number: number;
    total_parts: number;
    content: T;
    result?: string;
}

export class MultipartAPI extends BaseYdbAPI {
    private boundary = 'boundary'; // Fixed boundary as per server response
    private lastProcessedLength = 0;

    getPath(): string {
        return 'http://localhost:3000/stream';
    }

    async streamMultipartResponse<T>(
        url: string,
        onChunk: (chunk: MultipartChunk<T>) => void,
        params: Record<string, any> = {},
        options: AxiosOptions = {},
    ): Promise<void> {
        // Reset state for new request
        this.lastProcessedLength = 0;

        await this.get<string>(
            this.getPath(),
            {
                params,
            },
            {
                ...options,
                headers: {
                    Accept: 'multipart/x-mixed-replace',
                },
                onDownloadProgress: (progressEvent) => {
                    const response = progressEvent.event.target as XMLHttpRequest;
                    const responseText = response.responseText;

                    console.log('Progress event received');
                    console.log('Last processed length:', this.lastProcessedLength);
                    console.log('Current response length:', responseText.length);

                    // Get only the new data
                    const newData = responseText.slice(this.lastProcessedLength);
                    console.log('New data length:', newData.length);
                    console.log('New data:', newData);

                    if (newData) {
                        // Split on boundary with double dashes
                        const boundaryStr = `--${this.boundary}`;
                        const parts = newData.split(boundaryStr).filter(Boolean);

                        console.log('Number of parts found:', parts.length);

                        for (const part of parts) {
                            // Skip the final boundary marker
                            if (part.trim() === '--') {
                                console.log('Final boundary marker found, skipping');
                                continue;
                            }

                            console.log('Processing part:', part);
                            const chunk = this.parseChunk<T>(part);
                            if (chunk) {
                                console.log('Chunk parsed successfully:', chunk);
                                onChunk(chunk);
                            } else {
                                console.log('Failed to parse chunk');
                            }
                        }
                    }

                    // Update the processed length
                    this.lastProcessedLength = responseText.length;
                },
            },
        );
    }

    private parseChunk<T>(part: string): MultipartChunk<T> | null {
        try {
            console.log('Parsing chunk, part length:', part.length);

            // Split headers and body
            const lines = part.split('\n');
            let contentLength = 0;
            let bodyStartIndex = -1;

            // Parse headers
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line.startsWith('Content-Length:')) {
                    contentLength = parseInt(line.split(':')[1].trim(), 10);
                }
                // Empty line indicates end of headers
                if (line === '') {
                    bodyStartIndex = i + 1;
                    break;
                }
            }

            if (bodyStartIndex === -1 || !contentLength) {
                console.log('Invalid chunk format: missing headers or content length');
                return null;
            }

            // Get the body
            const body = lines[bodyStartIndex].trim();
            if (!body) {
                console.log('Invalid chunk format: empty body');
                return null;
            }

            // Parse the JSON content
            const content = JSON.parse(body);
            console.log('Parsed content:', content);

            // For the new format, we'll use the Counter value as the part number
            return {
                part_number: content.Counter || 0,
                total_parts: 0, // We don't know the total in advance
                content: content as T,
            };
        } catch (error) {
            console.error('Failed to parse chunk:', error);
            return null;
        }
    }
}

// Create and export a singleton instance
export const multipartAPI = new MultipartAPI();
