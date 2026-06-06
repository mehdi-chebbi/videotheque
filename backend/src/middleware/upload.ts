import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

const STORAGE_PATH = process.env.STORAGE_PATH || './storage';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const tempDir = path.join(STORAGE_PATH, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const videoMimeTypes = [
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-ms-wmv',
    'video/x-flv',
    'video/x-matroska',
    'video/webm',
    'video/3gpp',
    'video/x-m4v',
    'video/ogg',
    'video/avi',
    'video/mov',
  ];

  if (videoMimeTypes.includes(file.mimetype) || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error(`Type de fichier invalide : ${file.mimetype}. Seuls les fichiers vidéo sont autorisés.`));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: undefined, // No limit
  },
});
