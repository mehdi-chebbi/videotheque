import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import db from '../db/connection';
import { authenticate, requireAdmin, requireUploaderOrAdmin, upload } from '../middleware';
import { success, error, paginated } from '../utils/response';
import { createVideoDir, moveFile, deleteDir, getFileSize, getStoragePath } from '../services/storage';
import { processVideo } from '../services/thumbnail';

const router = Router();

// GET /videos - List/search videos with pagination and filters
router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  const {
    page = '1',
    limit = '20',
    project_id,
    search,
    tag,
    uploaded_by,
    sort_by = 'created_at',
    sort_order = 'desc',
  } = req.query;

  const pageNum = Math.max(1, parseInt(page as string, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
  const offset = (pageNum - 1) * limitNum;

  const validSortColumns = ['created_at', 'title', 'file_size', 'duration'];
  const sortColumn = validSortColumns.includes(sort_by as string) ? (sort_by as string) : 'created_at';
  const sortOrder = (sort_order as string) === 'asc' ? 'ASC' : 'DESC';

  try {
    let whereConditions: string[] = [];
    let params: unknown[] = [];
    let paramIndex = 1;
    let joinTags = false;

    if (project_id) {
      whereConditions.push(`v.project_id = $${paramIndex++}`);
      params.push(project_id);
    }

    if (search) {
      whereConditions.push(`(v.title ILIKE $${paramIndex++} OR v.description ILIKE $${paramIndex++})`);
      params.push(`%${search}%`, `%${search}%`);
    }

    if (tag) {
      joinTags = true;
      whereConditions.push(`t.name ILIKE $${paramIndex++}`);
      params.push(tag);
    }

    if (uploaded_by) {
      whereConditions.push(`v.uploaded_by = $${paramIndex++}`);
      params.push(uploaded_by);
    }

    const whereClause = whereConditions.length > 0
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    const tagJoin = joinTags
      ? `JOIN video_tags vt ON v.id = vt.video_id JOIN tags t ON vt.tag_id = t.id`
      : '';

    // Get total count
    const countResult = await db.query(
      `SELECT COUNT(DISTINCT v.id) as total FROM videos v ${tagJoin} ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total, 10);

    // Get paginated results
    const result = await db.query(
      `SELECT v.*, p.name as project_name, u.username as uploaded_by_username
       FROM videos v
       JOIN projects p ON v.project_id = p.id
       JOIN users u ON v.uploaded_by = u.id
       ${tagJoin}
       ${whereClause}
       ORDER BY v.${sortColumn} ${sortOrder}
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, limitNum, offset]
    );

    // Attach tags to each video
    const videoIds = result.rows.map((v: { id: string }) => v.id);
    let tagsMap: Record<string, { id: string; name: string }[]> = {};

    if (videoIds.length > 0) {
      const tagsResult = await db.query(`
        SELECT vt.video_id, t.id, t.name
        FROM video_tags vt
        JOIN tags t ON vt.tag_id = t.id
        WHERE vt.video_id = ANY($1)
      `, [videoIds]);

      for (const row of tagsResult.rows) {
        if (!tagsMap[row.video_id]) tagsMap[row.video_id] = [];
        tagsMap[row.video_id].push({ id: row.id, name: row.name });
      }
    }

    const videosWithTag = result.rows.map((v: { id: string } & Record<string, unknown>) => ({
      ...v,
      tags: tagsMap[v.id] || [],
    }));

    paginated(res, videosWithTag, total, pageNum, limitNum);
  } catch (err) {
    console.error('[VIDEOS] List error:', err);
    error(res, 'Internal server error.', 500);
  }
});

// GET /videos/:id - Get video details
router.get('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const result = await db.query(`
      SELECT v.*, p.name as project_name, u.username as uploaded_by_username
      FROM videos v
      JOIN projects p ON v.project_id = p.id
      JOIN users u ON v.uploaded_by = u.id
      WHERE v.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      error(res, 'Video not found.', 404);
      return;
    }

    // Get tags
    const tagsResult = await db.query(`
      SELECT t.id, t.name
      FROM video_tags vt
      JOIN tags t ON vt.tag_id = t.id
      WHERE vt.video_id = $1
    `, [id]);

    const video = {
      ...result.rows[0],
      tags: tagsResult.rows,
    };

    success(res, video);
  } catch (err) {
    console.error('[VIDEOS] Get error:', err);
    error(res, 'Internal server error.', 500);
  }
});

// GET /videos/:id/stream - Stream the video file
router.get('/:id/stream', authenticate, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const result = await db.query('SELECT file_path FROM videos WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      error(res, 'Video not found.', 404);
      return;
    }

    const filePath = result.rows[0].file_path;

    if (!fs.existsSync(filePath)) {
      error(res, 'Video file not found on disk.', 404);
      return;
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      // Support range requests for seeking
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      const fileStream = fs.createReadStream(filePath, { start, end });
      const ext = path.extname(filePath).toLowerCase();

      const mimeTypes: Record<string, string> = {
        '.mp4': 'video/mp4',
        '.avi': 'video/x-msvideo',
        '.mov': 'video/quicktime',
        '.mkv': 'video/x-matroska',
        '.webm': 'video/webm',
        '.wmv': 'video/x-ms-wmv',
        '.flv': 'video/x-flv',
        '.mpeg': 'video/mpeg',
        '.mpg': 'video/mpeg',
        '.3gp': 'video/3gpp',
        '.m4v': 'video/x-m4v',
        '.ogv': 'video/ogg',
      };

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': mimeTypes[ext] || 'video/mp4',
      });

      fileStream.pipe(res);
    } else {
      res.sendFile(filePath);
    }
  } catch (err) {
    console.error('[VIDEOS] Stream error:', err);
    error(res, 'Internal server error.', 500);
  }
});

// GET /videos/:id/thumbnail - Serve thumbnail image
router.get('/:id/thumbnail', authenticate, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const result = await db.query('SELECT thumbnail_path FROM videos WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      error(res, 'Video not found.', 404);
      return;
    }

    const thumbnailPath = result.rows[0].thumbnail_path;

    if (!thumbnailPath || !fs.existsSync(thumbnailPath)) {
      error(res, 'Thumbnail not found.', 404);
      return;
    }

    res.sendFile(thumbnailPath);
  } catch (err) {
    console.error('[VIDEOS] Thumbnail error:', err);
    error(res, 'Internal server error.', 500);
  }
});

// POST /videos - Upload a new video (admin + uploader)
router.post('/', authenticate, requireUploaderOrAdmin(), upload.single('video'), async (req: Request, res: Response): Promise<void> => {
  const { title, description, project_id, tags } = req.body;
  const file = req.file;

  if (!file) {
    error(res, 'No video file provided.', 400);
    return;
  }

  if (!title || !project_id) {
    // Clean up temp file
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    error(res, 'Title and project_id are required.', 400);
    return;
  }

  try {
    // Verify project exists
    const projectResult = await db.query('SELECT id, name FROM projects WHERE id = $1', [project_id]);
    if (projectResult.rows.length === 0) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      error(res, 'Project not found.', 404);
      return;
    }

    const projectName = projectResult.rows[0].name;

    // Create video directory in project folder
    const { videoDir, videoId } = createVideoDir(projectName);

    // Move video file from temp to final location
    const ext = path.extname(file.originalname) || path.extname(file.path);
    const finalVideoPath = path.join(videoDir, `video${ext}`);
    moveFile(file.path, finalVideoPath);

    // Get file size
    const fileSize = getFileSize(finalVideoPath);

    // Generate thumbnail + extract metadata with ffmpeg
    const thumbnailFileName = 'thumbnail.png';
    const thumbnailPath = path.join(videoDir, thumbnailFileName);

    let metadata = { duration: null as number | null, format: null as string | null, thumbnailPath: '' };
    try {
      metadata = await processVideo(finalVideoPath, thumbnailPath);
    } catch (err) {
      console.warn('[VIDEOS] FFmpeg processing failed, continuing without metadata:', (err as Error).message);
    }

    // Parse tags (can be JSON string or comma-separated)
    let tagList: string[] = [];
    if (tags) {
      try {
        tagList = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch {
        tagList = (tags as string).split(',').map((t: string) => t.trim()).filter(Boolean);
      }
    }

    // Insert video into database
    const result = await db.query(
      `INSERT INTO videos (id, title, description, project_id, file_path, thumbnail_path, file_size, duration, format, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        videoId,
        title,
        description || null,
        project_id,
        finalVideoPath,
        metadata.thumbnailPath || null,
        fileSize,
        metadata.duration,
        metadata.format,
        req.user!.userId,
      ]
    );

    // Handle tags
    const videoTags: { id: string; name: string }[] = [];
    for (const tagName of tagList) {
      // Upsert tag
      const tagResult = await db.query(
        `INSERT INTO tags (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = $1 RETURNING id, name`,
        [tagName.toLowerCase().trim()]
      );
      const tag = tagResult.rows[0];

      // Link tag to video
      await db.query(
        `INSERT INTO video_tags (video_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [videoId, tag.id]
      );
      videoTags.push(tag);
    }

    success(res, {
      ...result.rows[0],
      tags: videoTags,
    }, 201);
  } catch (err) {
    console.error('[VIDEOS] Upload error:', err);
    error(res, 'Internal server error.', 500);
  }
});

// PUT /videos/:id - Update video metadata (admin + uploader for own)
router.put('/:id', authenticate, requireUploaderOrAdmin(), async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { title, description, project_id, tags } = req.body;

  try {
    const existing = await db.query('SELECT * FROM videos WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      error(res, 'Video not found.', 404);
      return;
    }

    // Uploader can only edit their own videos
    if (req.user!.role === 'uploader' && existing.rows[0].uploaded_by !== req.user!.userId) {
      error(res, 'You can only edit your own videos.', 403);
      return;
    }

    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (title) {
      updates.push(`title = $${paramIndex++}`);
      values.push(title);
    }

    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description);
    }

    if (project_id) {
      const projectExists = await db.query('SELECT id FROM projects WHERE id = $1', [project_id]);
      if (projectExists.rows.length === 0) {
        error(res, 'Project not found.', 404);
        return;
      }
      updates.push(`project_id = $${paramIndex++}`);
      values.push(project_id);
    }

    if (updates.length > 0) {
      values.push(id);
      await db.query(
        `UPDATE videos SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
        values
      );
    }

    // Update tags if provided
    if (tags) {
      let tagList: string[] = [];
      try {
        tagList = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch {
        tagList = (tags as string).split(',').map((t: string) => t.trim()).filter(Boolean);
      }

      // Remove existing tag associations
      await db.query('DELETE FROM video_tags WHERE video_id = $1', [id]);

      // Add new tags
      for (const tagName of tagList) {
        const tagResult = await db.query(
          `INSERT INTO tags (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = $1 RETURNING id, name`,
          [tagName.toLowerCase().trim()]
        );
        const tag = tagResult.rows[0];
        await db.query(
          `INSERT INTO video_tags (video_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [id, tag.id]
        );
      }
    }

    // Fetch updated video with tags
    const result = await db.query(`
      SELECT v.*, p.name as project_name, u.username as uploaded_by_username
      FROM videos v
      JOIN projects p ON v.project_id = p.id
      JOIN users u ON v.uploaded_by = u.id
      WHERE v.id = $1
    `, [id]);

    const tagsResult = await db.query(`
      SELECT t.id, t.name
      FROM video_tags vt
      JOIN tags t ON vt.tag_id = t.id
      WHERE vt.video_id = $1
    `, [id]);

    success(res, {
      ...result.rows[0],
      tags: tagsResult.rows,
    });
  } catch (err) {
    console.error('[VIDEOS] Update error:', err);
    error(res, 'Internal server error.', 500);
  }
});

// DELETE /videos/:id - Delete a video (admin: any, uploader: own only)
router.delete('/:id', authenticate, requireUploaderOrAdmin(), async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const existing = await db.query('SELECT * FROM videos WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      error(res, 'Video not found.', 404);
      return;
    }

    // Uploader can only delete their own videos
    if (req.user!.role === 'uploader' && existing.rows[0].uploaded_by !== req.user!.userId) {
      error(res, 'You can only delete your own videos.', 403);
      return;
    }

    const video = existing.rows[0];

    // Delete files from disk
    const videoDir = path.dirname(video.file_path);
    deleteDir(videoDir);

    // Delete from database (cascade will handle video_tags)
    await db.query('DELETE FROM videos WHERE id = $1', [id]);

    success(res, { message: 'Video deleted successfully.' });
  } catch (err) {
    console.error('[VIDEOS] Delete error:', err);
    error(res, 'Internal server error.', 500);
  }
});

export default router;
