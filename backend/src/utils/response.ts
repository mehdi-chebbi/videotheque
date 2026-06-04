import { Response } from 'express';

export function success(res: Response, data: unknown, statusCode: number = 200): Response {
  return res.status(statusCode).json({ success: true, data });
}

export function error(res: Response, message: string, statusCode: number = 400): Response {
  return res.status(statusCode).json({ success: false, error: message });
}

export function paginated(
  res: Response,
  data: unknown[],
  total: number,
  page: number,
  limit: number
): Response {
  return res.status(200).json({
    success: true,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}
