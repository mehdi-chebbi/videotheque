export interface VideoMetadata {
    duration: number | null;
    format: string | null;
}
/**
 * Generate a thumbnail from a video file at a specific timestamp
 */
export declare function generateThumbnail(videoPath: string, outputPath: string, timestamp?: string): Promise<string>;
/**
 * Extract video metadata using ffprobe (duration, format)
 */
export declare function extractMetadata(videoPath: string): Promise<VideoMetadata>;
/**
 * Generate thumbnail + extract metadata in one pass
 */
export declare function processVideo(videoPath: string, thumbnailOutputPath: string): Promise<VideoMetadata & {
    thumbnailPath: string;
}>;
//# sourceMappingURL=thumbnail.d.ts.map