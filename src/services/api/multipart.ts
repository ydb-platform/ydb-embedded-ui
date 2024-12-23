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
                        const boundaryStr = `--${this.boundary}`;
                        const parts = newData.split(boundaryStr);

                        console.log('Number of parts found:', parts.length);
                        console.log('Parts:', parts);

                        // Process all parts including the first one
                        for (let i = 0; i < parts.length; i++) {
                            const part = parts[i].trim();
                            if (!part) {
                                console.log('Empty part, skipping:', i);
                                continue;
                            }

                            console.log('Processing part:', i, 'Content:', part);
                            const chunk = this.parseChunk<T>(part);
                            if (chunk) {
                                console.log('Chunk parsed successfully:', chunk);
                                onChunk(chunk);
                            } else {
                                console.log('Failed to parse chunk for part:', i);
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

            // Split headers and body using CRLF sequence
            const sections = part.split('\r\n\r\n');
            console.log('Number of sections:', sections.length);

            if (sections.length < 2) {
                console.log('Invalid chunk format: not enough sections');
                return null;
            }

            console.log('Headers:', sections[0]);
            console.log('Body:', sections[1]);

            const body = sections[1].trim();
            if (!body) {
                console.log('Invalid chunk format: empty body');
                return null;
            }

            // Parse the JSON content
            const content = JSON.parse(body);
            console.log('Parsed content:', content);

            // Wrap in MultipartChunk format
            return {
                part_number: Math.floor(Math.random() * 1000), // Temporary random number for testing
                total_parts: 100, // Using a placeholder since total is unknown
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
