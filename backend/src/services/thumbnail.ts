import ffmpeg from 'fluent-ffmpeg';
import path from 'path';

const FFMPEG_PATH = process.env.FFMPEG_PATH || '/usr/bin/ffmpeg';
const FFPROBE_PATH = process.env.FFPROBE_PATH || '/usr/bin/ffprobe';

ffmpeg.setFfmpegPath(FFMPEG_PATH);
ffmpeg.setFfprobePath(FFPROBE_PATH);

export interface VideoMetadata {
  duration: number | null;
  format: string | null;
}

/**
 * Generate a thumbnail from a video file at a specific timestamp
 */
export function generateThumbnail(
  videoPath: string,
  outputPath: string,
  timestamp: string = '00:00:01'
): Promise<string> {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .screenshots({
        timestamps: [timestamp],
        filename: path.basename(outputPath),
        folder: path.dirname(outputPath),
        size: '640x360',
      })
      .on('end', () => {
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error('[FFMPEG] Thumbnail generation failed:', err.message);
        reject(err);
      });
  });
}

/**
 * Extract video metadata using ffprobe (duration, format)
 */
export function extractMetadata(videoPath: string): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        console.error('[FFPROBE] Metadata extraction failed:', err.message);
        reject(err);
        return;
      }

      const duration = metadata.format?.duration ?? null;
      const format = metadata.format?.format_name ?? null;

      resolve({ duration, format });
    });
  });
}

/**
 * Generate thumbnail + extract metadata in one pass
 */
export async function processVideo(
  videoPath: string,
  thumbnailOutputPath: string
): Promise<VideoMetadata & { thumbnailPath: string }> {
  const [metadata] = await Promise.all([
    extractMetadata(videoPath),
    generateThumbnail(videoPath, thumbnailOutputPath),
  ]);

  return {
    ...metadata,
    thumbnailPath: thumbnailOutputPath,
  };
}
