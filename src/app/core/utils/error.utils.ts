import { HttpErrorResponse } from '@angular/common/http';
import { AppError } from '../models/app-error.model';

const STATUS_CODES: Record<number, string> = {
    0:   'NETWORK_ERROR',
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    422: 'VALIDATION_ERROR',
    429: 'RATE_LIMITED',
    500: 'SERVER_ERROR',
    502: 'BAD_GATEWAY',
    503: 'SERVICE_UNAVAILABLE',
};

const STATUS_MESSAGES: Record<number, string> = {
    0:   'Cannot reach the server. Please check your connection.',
    401: 'Your session has expired. Please log in again.',
    403: 'You do not have permission to perform this action.',
    404: 'The requested resource was not found.',
    409: 'This action conflicts with existing data.',
    429: 'Too many requests. Please wait a moment and try again.',
    500: 'A server error occurred. Please try again later.',
    503: 'The service is temporarily unavailable. Please try again later.',
};

/**
 * Converts an Angular HttpErrorResponse into a flat, display-ready AppError.
 *
 * The backend can return errors in any of these shapes:
 *   { message: string }
 *   { error: { message: string } }
 *   { errors: Record<string, string> }    ← validation
 *
 * Also handles the special case where the server returned HTML instead of JSON
 * (SyntaxError: Unrecognized token '<') — typically happens when the backend is
 * restarting or a proxy returns an error page.
 */
export function normalizeHttpError(err: HttpErrorResponse): AppError {
    const body = err.error;

    // Guard: server returned HTML (or other non-JSON) → HttpClient throws SyntaxError.
    // Surface a clean message instead of the raw "Unexpected token '<'".
    if (body instanceof SyntaxError) {
        return {
            status:  err.status,
            code:    'PARSE_ERROR',
            message: 'The server returned an unexpected response. Please try again.',
        };
    }

    const message: string =
        body?.message ??
        body?.error?.message ??
        STATUS_MESSAGES[err.status] ??
        err.message ??
        'An unexpected error occurred.';

    const fieldErrors: Record<string, string> | undefined =
        body?.errors ?? body?.fieldErrors ?? undefined;

    return {
        status:  err.status,
        code:    STATUS_CODES[err.status] ?? 'UNKNOWN_ERROR',
        message,
        fieldErrors,
    };
}
