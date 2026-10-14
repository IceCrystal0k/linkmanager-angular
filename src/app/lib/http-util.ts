/**
 * get http error message from the error object
 * @param err error object from http request
 * @param defaultError default error message to return if no specific error is found
 * @returns the error message
 */
export function getHttpErrormessage(err: any, defaultError: string): string | string[] {
  if (!err || typeof err !== 'object') {
    return defaultError;
  }
  if (err.status === 0) {
        return 'Network error: Please check your internet connection.';
    }
    let errorMsg: string | string[] = defaultError;
    if (err.error?.errors && Array.isArray(err.error.errors)) {
        if (typeof err.error.errors[0] === 'string') {
            errorMsg = err.error.errors;
        } else if (typeof err.error.errors[0] === 'object') {
            errorMsg = Object.values(err.error.errors[0]).flat() as string[];
        }
    } else if (err.message) {
        errorMsg = err.message;
    }
    return errorMsg;
}
