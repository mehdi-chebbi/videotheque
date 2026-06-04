import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_PATH = process.env.STORAGE_PATH || './storage';

/**
 * Ensure the base storage directory exists
 */
export function ensureStorageDir(): void {
  if (!fs.existsSync(STORAGE_PATH)) {
    fs.mkdirSync(STORAGE_PATH, { recursive: true });
  }
  const tempDir = path.join(STORAGE_PATH, 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
}

/**
 * Create a project directory in storage
 */
export function createProjectDir(projectName: string): string {
  const safeName = projectName.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  const projectDir = path.join(STORAGE_PATH, safeName);
  if (!fs.existsSync(projectDir)) {
    fs.mkdirSync(projectDir, { recursive: true });
  }
  return projectDir;
}

/**
 * Create a directory for a video within a project
 */
export function createVideoDir(projectName: string): { videoDir: string; videoId: string } {
  const videoId = uuidv4();
  const safeName = projectName.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  const videoDir = path.join(STORAGE_PATH, safeName, videoId);
  fs.mkdirSync(videoDir, { recursive: true });
  return { videoDir, videoId };
}

/**
 * Move a file from temp to its final location
 */
export function moveFile(from: string, to: string): void {
  const targetDir = path.dirname(to);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  fs.renameSync(from, to);
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
 * Delete a directory recursively
 */
export function deleteDir(dirPath: string): void {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
}

/**
 * Get file size in bytes
 */
export function getFileSize(filePath: string): number {
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
