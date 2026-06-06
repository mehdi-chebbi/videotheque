import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_PATH = process.env.STORAGE_PATH || './storage';

/**
 * Ensure the base storage directories exist
 */
export function ensureStorageDir(): void {
  for (const dir of [STORAGE_PATH, path.join(STORAGE_PATH, 'temp'), path.join(STORAGE_PATH, 'videos'), path.join(STORAGE_PATH, 'thumbnails')]) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

/**
 * Generate a new video ID and return the paths for video file and thumbnail
 */
export function getVideoPaths(ext: string): { videoId: string; videoPath: string; thumbnailPath: string } {
  const videoId = uuidv4();
  return {
    videoId,
    videoPath: path.join(STORAGE_PATH, 'videos', `${videoId}${ext}`),
    thumbnailPath: path.join(STORAGE_PATH, 'thumbnails', `${videoId}.png`),
  };
}

/**
 * Move a file from temp to its final location
 * Always uses copy + delete instead of rename, because renameSync
 * can silently fail on Docker bind mounts (Windows/WSL2).
 */
export function moveFile(from: string, to: string): void {
  const targetDir = path.dirname(to);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  fs.copyFileSync(from, to);
  fs.unlinkSync(from);
}

/**
 * Delete a file if it exists
 */
export function deleteFile(filePath: string): void {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

/**
 * Delete both video and thumbnail files for a given video ID
 */
export function deleteVideoFiles(videoId: string, ext: string): void {
  deleteFile(path.join(STORAGE_PATH, 'videos', `${videoId}${ext}`));
  deleteFile(path.join(STORAGE_PATH, 'thumbnails', `${videoId}.png`));
}

/**
 * Get file size in bytes
 */
export function getFileSize(filePath: string): number {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  const stats = fs.statSync(filePath);
  return stats.size;
}

/**
 * Get the absolute storage path
 */
export function getStoragePath(): string {
  return path.resolve(STORAGE_PATH);
}

/**
 * Check if a file exists
 */
export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}
