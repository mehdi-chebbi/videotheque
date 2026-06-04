"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureStorageDir = ensureStorageDir;
exports.createProjectDir = createProjectDir;
exports.createVideoDir = createVideoDir;
exports.moveFile = moveFile;
exports.deleteFile = deleteFile;
exports.deleteDir = deleteDir;
exports.getFileSize = getFileSize;
exports.getStoragePath = getStoragePath;
exports.fileExists = fileExists;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const STORAGE_PATH = process.env.STORAGE_PATH || './storage';
/**
 * Ensure the base storage directory exists
 */
function ensureStorageDir() {
    if (!fs_1.default.existsSync(STORAGE_PATH)) {
        fs_1.default.mkdirSync(STORAGE_PATH, { recursive: true });
    }
    const tempDir = path_1.default.join(STORAGE_PATH, 'temp');
    if (!fs_1.default.existsSync(tempDir)) {
        fs_1.default.mkdirSync(tempDir, { recursive: true });
    }
}
/**
 * Create a project directory in storage
 */
function createProjectDir(projectName) {
    const safeName = projectName.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    const projectDir = path_1.default.join(STORAGE_PATH, safeName);
    if (!fs_1.default.existsSync(projectDir)) {
        fs_1.default.mkdirSync(projectDir, { recursive: true });
    }
    return projectDir;
}
/**
 * Create a directory for a video within a project
 */
function createVideoDir(projectName) {
    const videoId = (0, uuid_1.v4)();
    const safeName = projectName.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    const videoDir = path_1.default.join(STORAGE_PATH, safeName, videoId);
    fs_1.default.mkdirSync(videoDir, { recursive: true });
    return { videoDir, videoId };
}
/**
 * Move a file from temp to its final location
 */
function moveFile(from, to) {
    const targetDir = path_1.default.dirname(to);
    if (!fs_1.default.existsSync(targetDir)) {
        fs_1.default.mkdirSync(targetDir, { recursive: true });
    }
    fs_1.default.renameSync(from, to);
}
/**
 * Delete a file if it exists
 */
function deleteFile(filePath) {
    if (fs_1.default.existsSync(filePath)) {
        fs_1.default.unlinkSync(filePath);
    }
}
/**
 * Delete a directory recursively
 */
function deleteDir(dirPath) {
    if (fs_1.default.existsSync(dirPath)) {
        fs_1.default.rmSync(dirPath, { recursive: true, force: true });
    }
}
/**
 * Get file size in bytes
 */
function getFileSize(filePath) {
    const stats = fs_1.default.statSync(filePath);
    return stats.size;
}
/**
 * Get the absolute storage path
 */
function getStoragePath() {
    return path_1.default.resolve(STORAGE_PATH);
}
/**
 * Check if a file exists
 */
function fileExists(filePath) {
    return fs_1.default.existsSync(filePath);
}
//# sourceMappingURL=storage.js.map