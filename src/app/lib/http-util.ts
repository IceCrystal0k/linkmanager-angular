/**
 * get http error message from the error object
 * @param err error object from http request
 * @param defaultError default error message to return if no specific error is found
 * @returns the error message
 */
export function getHttpErrormessage(err: any, defaultError: string): string {
    if (err.status === 0) {
        return 'Network error: Please check your internet connection.';;
    }
    const errorMsg = err.error?.errors?.join('<br/>') || err.message || defaultError;
    return errorMsg;
}
