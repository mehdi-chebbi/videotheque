"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateThumbnail = generateThumbnail;
exports.extractMetadata = extractMetadata;
exports.processVideo = processVideo;
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const path_1 = __importDefault(require("path"));
const FFMPEG_PATH = process.env.FFMPEG_PATH || '/usr/bin/ffmpeg';
const FFPROBE_PATH = process.env.FFPROBE_PATH || '/usr/bin/ffprobe';
fluent_ffmpeg_1.default.setFfmpegPath(FFMPEG_PATH);
fluent_ffmpeg_1.default.setFfprobePath(FFPROBE_PATH);
/**
 * Generate a thumbnail from a video file at a specific timestamp
 */
function generateThumbnail(videoPath, outputPath, timestamp = '00:00:01') {
    return new Promise((resolve, reject) => {
        (0, fluent_ffmpeg_1.default)(videoPath)
            .screenshots({
            timestamps: [timestamp],
            filename: path_1.default.basename(outputPath),
            folder: path_1.default.dirname(outputPath),
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
function extractMetadata(videoPath) {
    return new Promise((resolve, reject) => {
        fluent_ffmpeg_1.default.ffprobe(videoPath, (err, metadata) => {
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
async function processVideo(videoPath, thumbnailOutputPath) {
    const [metadata] = await Promise.all([
        extractMetadata(videoPath),
        generateThumbnail(videoPath, thumbnailOutputPath),
    ]);
    return {
        ...metadata,
        thumbnailPath: thumbnailOutputPath,
    };
}
//# sourceMappingURL=thumbnail.js.map