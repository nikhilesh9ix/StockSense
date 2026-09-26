import type { Request, Response, NextFunction } from 'express';
import type { AnyZodObject} from 'zod';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors';

export function validate(schema: AnyZodObject) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(
          new AppError(
            'VALIDATION_ERROR',
            'Validation failed',
            400,
            error.errors.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
            }))
          )
        );
      } else {
        next(error);
      }
    }
  };
}