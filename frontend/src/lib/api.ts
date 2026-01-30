/**
 * Safely parses a JSON response from the API.
 * Prevents "JSON.parse: unexpected character" errors by checking Content-Type
 * and handling non-OK status codes gracefully.
 */
export async function handleApiResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');

  let data = null;
  if (isJson) {
    try {
      data = await res.json();
    } catch (e) {
      console.error('Failed to parse JSON response', e);
    }
  }

  if (!res.ok) {
    // Attempt to extract error message from JSON body, fall back to status text
    const errorMsg =
      data?.error || data?.message || `Server error: ${res.status} ${res.statusText}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

/**
 * Helper for fetch with automatic JSON handling and error safety
 */
export async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, options);
  return handleApiResponse<T>(res);
}
