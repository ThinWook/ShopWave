import { ApiError, ApiFieldError } from './api';

export interface FormattedError {
  message: string;
  fieldErrors?: Record<string, string[]>;
  traceId?: string;
}

export function formatApiError(err: unknown): FormattedError {
  if (err instanceof ApiError) {
    const fieldErrors: Record<string, string[]> = {};
    if (err.fieldErrors && err.fieldErrors.length > 0) {
      err.fieldErrors.forEach((fe: ApiFieldError) => {
        const key = fe.field || '_general';
        if (!fieldErrors[key]) fieldErrors[key] = [];
        fieldErrors[key].push(fe.message);
      });
    }
    return {
      message: err.message,
      fieldErrors: Object.keys(fieldErrors).length ? fieldErrors : undefined,
      traceId: err.traceId
    };
  }
  if (err instanceof Error) {
    return { message: err.message };
  }
  return { message: 'Unknown error' };
}

// Utility to join field errors for simple toast display
export function humanizeFieldErrors(fieldErrors?: Record<string, string[]>): string | undefined {
  if (!fieldErrors) return undefined;
  return Object.entries(fieldErrors)
    .map(([field, msgs]) => field === '_general' ? msgs.join('; ') : `${field}: ${msgs.join(', ')}`)
    .join(' | ');
}
