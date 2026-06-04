/**
 * Ensure the base storage directory exists
 */
export declare function ensureStorageDir(): void;
/**
 * Create a project directory in storage
 */
export declare function createProjectDir(projectName: string): string;
/**
 * Create a directory for a video within a project
 */
export declare function createVideoDir(projectName: string): {
    videoDir: string;
    videoId: string;
};
/**
 * Move a file from temp to its final location
 */
export declare function moveFile(from: string, to: string): void;
/**
 * Delete a file if it exists
 */
export declare function deleteFile(filePath: string): void;
/**
 * Delete a directory recursively
 */
export declare function deleteDir(dirPath: string): void;
/**
 * Get file size in bytes
 */
export declare function getFileSize(filePath: string): number;
/**
 * Get the absolute storage path
 */
export declare function getStoragePath(): string;
/**
 * Check if a file exists
 */
export declare function fileExists(filePath: string): boolean;
//# sourceMappingURL=storage.d.ts.map