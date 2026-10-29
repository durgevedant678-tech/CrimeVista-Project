export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Human-readable copy for any error — never exposes raw payloads or stack traces. */
export function friendlyError(error: unknown): {title: string;description: string;status: number;} {
  if (error instanceof ApiError) {
    if (error.status === 0)
    return { title: 'Check your connection', description: 'CrimeVista could not reach the data service.', status: 0 };
    if (error.status === 401)
    return {
      title: 'Administrator sign-in required',
      description: 'Sign in from Settings to use this action.',
      status: 401
    };
    if (error.status === 404) return { title: 'Not found', description: error.message, status: 404 };
    return { title: 'Something went wrong', description: error.message, status: error.status };
  }
  return { title: 'Something went wrong', description: 'Please try again in a moment.', status: -1 };
}

export function statusMessage(status: number, detail?: string): string {
  if (detail && detail.length < 200) return detail;
  if (status === 401) return 'Administrator sign-in required.';
  if (status === 409) return 'Another upload is already being processed. Try again shortly.';
  if (status === 413) return 'The file is larger than the allowed size.';
  if (status === 422) return 'Some of the submitted values are not valid.';
  if (status >= 500) return 'The server had a problem completing this request.';
  return 'The request could not be completed.';
}