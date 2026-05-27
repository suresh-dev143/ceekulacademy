/**
 * Media Upload Progress Tracker
 * Handles progress calculation and formatting
 */

import { HttpProgressEvent } from '@angular/common/http';
import { UploadProgress } from './media-upload.interfaces';

export class UploadProgressTracker {
  private startTime: number = 0;
  private previousLoaded: number = 0;

  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Calculate upload progress from HTTP event
   */
  calculateProgress(event: HttpProgressEvent): UploadProgress {
    const loaded = event.loaded;
    const total = event.total || 0;
    const percentage = total > 0 ? Math.round((loaded / total) * 100) : 0;
    const elapsedMs = Date.now() - this.startTime;
    const uploadSpeed = elapsedMs > 0 ? (loaded / (elapsedMs / 1000)) : 0;
    const remainingBytes = total - loaded;
    const remainingTime = uploadSpeed > 0 ? Math.ceil(remainingBytes / uploadSpeed) : 0;

    return {
      loaded,
      total,
      percentage,
      state: this.getProgressState(percentage),
      uploadSpeed,
      remainingTime,
    };
  }

  /**
   * Determine progress state
   */
  private getProgressState(
    percentage: number
  ): 'pending' | 'uploading' | 'completed' | 'failed' {
    if (percentage === 0) return 'pending';
    if (percentage === 100) return 'completed';
    if (percentage > 0) return 'uploading';
    return 'pending';
  }

  /**
   * Format bytes to human-readable size
   */
  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Format upload speed
   */
  static formatSpeed(bytesPerSecond: number): string {
    return `${this.formatBytes(bytesPerSecond)}/s`;
  }

  /**
   * Format time in seconds to human-readable format
   */
  static formatTime(seconds: number): string {
    if (seconds < 60) return `${Math.ceil(seconds)}s`;
    if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const secs = Math.ceil(seconds % 60);
      return `${minutes}m ${secs}s`;
    }
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }

  /**
   * Reset tracker
   */
  reset(): void {
    this.startTime = Date.now();
    this.previousLoaded = 0;
  }

  /**
   * Get elapsed time in seconds
   */
  getElapsedTime(): number {
    return (Date.now() - this.startTime) / 1000;
  }
}
