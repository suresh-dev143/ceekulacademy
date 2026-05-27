/**
 * Media Upload Error Handler
 * Centralized error handling and transformation
 */

import { HttpErrorResponse } from '@angular/common/http';
import { UploadError, HTTP_STATUS_CODES } from './media-upload.interfaces';

export class UploadErrorHandler {
  /**
   * Transform HTTP error into structured UploadError
   */
  static handleError(error: Error | HttpErrorResponse): UploadError {
    if (error instanceof HttpErrorResponse) {
      return this.handleHttpError(error);
    }

    if (error instanceof TypeError || error.name === 'TimeoutError') {
      return {
        code: 'TIMEOUT_ERROR',
        message: 'Upload request timed out. Please check your connection.',
        details: error.message,
        retryable: true,
        originalError: error,
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred during upload.',
      details: error.message,
      retryable: false,
      originalError: error,
    };
  }

  /**
   * Handle HTTP-specific errors
   */
  private static handleHttpError(error: HttpErrorResponse): UploadError {
    const status = error.status;
    const errorData: any = error.error || {};
    const errorMessage = typeof errorData === 'string' ? errorData : errorData['message'];
    const errorDetails = typeof errorData === 'string' ? undefined : errorData['details'];

    // Network error (status 0)
    if (status === 0) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Network error. Please check your connection.',
        statusCode: status,
        details: 'Failed to connect to the server.',
        retryable: true,
        originalError: error,
      };
    }

    // 400 Bad Request
    if (status === HTTP_STATUS_CODES.BAD_REQUEST) {
      return {
        code: 'VALIDATION_ERROR',
        message: errorMessage || 'Invalid file or request format.',
        statusCode: status,
        details: errorDetails,
        retryable: false,
        originalError: error,
      };
    }

    // 401 Unauthorized
    if (status === HTTP_STATUS_CODES.UNAUTHORIZED) {
      return {
        code: 'AUTH_ERROR',
        message: 'Authentication required. Please log in.',
        statusCode: status,
        retryable: false,
        originalError: error,
      };
    }

    // 403 Forbidden
    if (status === HTTP_STATUS_CODES.FORBIDDEN) {
      return {
        code: 'FORBIDDEN_ERROR',
        message: 'You do not have permission to upload files.',
        statusCode: status,
        retryable: false,
        originalError: error,
      };
    }

    // 404 Not Found
    if (status === HTTP_STATUS_CODES.NOT_FOUND) {
      return {
        code: 'NOT_FOUND_ERROR',
        message: 'Upload endpoint not found.',
        statusCode: status,
        retryable: false,
        originalError: error,
      };
    }

    // 409 Conflict
    if (status === HTTP_STATUS_CODES.CONFLICT) {
      return {
        code: 'CONFLICT_ERROR',
        message: 'File already exists or conflict detected.',
        statusCode: status,
        details: errorDetails,
        retryable: false,
        originalError: error,
      };
    }

    // 413 Payload Too Large
    if (status === HTTP_STATUS_CODES.PAYLOAD_TOO_LARGE) {
      return {
        code: 'FILE_TOO_LARGE',
        message: 'File is too large. Please choose a smaller file.',
        statusCode: status,
        retryable: false,
        originalError: error,
      };
    }

    // 500 Internal Server Error
    if (status === HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR) {
      return {
        code: 'SERVER_ERROR',
        message: 'Server error. Please try again later.',
        statusCode: status,
        details: errorDetails,
        retryable: true,
        originalError: error,
      };
    }

    // 503 Service Unavailable
    if (status === HTTP_STATUS_CODES.SERVICE_UNAVAILABLE) {
      return {
        code: 'SERVER_ERROR',
        message: 'Service is temporarily unavailable. Please try again later.',
        statusCode: status,
        retryable: true,
        originalError: error,
      };
    }

    // 504 Gateway Timeout
    if (status === HTTP_STATUS_CODES.GATEWAY_TIMEOUT) {
      return {
        code: 'TIMEOUT_ERROR',
        message: 'Request timeout. Please try again.',
        statusCode: status,
        retryable: true,
        originalError: error,
      };
    }

    // Generic server error for other 5xx
    if (status >= 500) {
      return {
        code: 'SERVER_ERROR',
        message: 'Server error occurred. Please try again later.',
        statusCode: status,
        retryable: true,
        originalError: error,
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: errorMessage || 'An error occurred during upload.',
      statusCode: status,
      details: errorDetails,
      retryable: false,
      originalError: error,
    };
  }

  /**
   * Check if error is retryable
   */
  static isRetryable(error: UploadError): boolean {
    const retryableCodes = [
      'NETWORK_ERROR',
      'TIMEOUT_ERROR',
      'SERVER_ERROR',
    ];
    return error.retryable || retryableCodes.includes(error.code);
  }

  /**
   * Format error message for user display
   */
  static formatErrorMessage(error: UploadError): string {
    return error.message;
  }

  /**
   * Log error for debugging (can be extended with actual logging service)
   */
  static logError(context: string, error: UploadError): void {
    console.error(`[${context}] Upload Error:`, {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      details: error.details,
      timestamp: new Date().toISOString(),
    });
  }
}
