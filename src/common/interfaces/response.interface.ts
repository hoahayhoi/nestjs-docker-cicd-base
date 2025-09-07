import type { Response } from 'express';

export interface EnhancedResponse extends Response {
  addWarning?: (message: string) => void;
}
