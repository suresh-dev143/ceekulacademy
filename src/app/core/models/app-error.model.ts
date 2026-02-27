/** Normalised error shape used everywhere in the app after HTTP errors are caught. */
export interface AppError {
    /** HTTP status code (0 = network error) */
    status: number;
    /** Short machine-readable code derived from status */
    code: string;
    /** Human-readable message ready for display */
    message: string;
    /** Per-field validation messages keyed by field name, if the API returns them */
    fieldErrors?: Record<string, string>;
}
