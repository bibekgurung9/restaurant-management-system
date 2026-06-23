// types.d.ts
import { Express } from 'express';

declare global {
  namespace Express {
    interface Request {
      files: {
        [fieldname: string]: Express.Multer.File[];
      };
    }
  }
}
