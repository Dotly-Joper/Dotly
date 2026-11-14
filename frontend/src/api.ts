export class ApiError extends Error {
    status: number;
    code: string;

    constructor(status: number, code: string, message: string) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.code = code;
    }
}

export async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
    let response: Response;
    try {
        response = await fetch(url, options);
    } catch {
        throw new ApiError(0, "NETWORK", "Could not reach the server. Please try again.");
    }

    let body;
    try {
        body = await response.json();
    } catch {
        throw new ApiError(response.status, "NETWORK", "The server returned an invalid response. Please try again.");
    }

    if (!response.ok) {
        throw new ApiError(
            response.status,
            typeof body?.error?.code === "string" ? body.error.code : "NETWORK",
            typeof body?.error?.message === "string" ? body.error.message : "The request failed. Please try again.",
        );
    }
    //T describes the type for TypeScript but does not validate JSON at runtime.
    return body as T;
}
