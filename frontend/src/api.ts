export class ApiError extends Error {
    status: number;
    code : string;

    constructor(status: number, code: string, message: string) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.code = code;
    }
}

export async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, options);

    if (!response.ok) {
        const body = await response.json();

        throw new ApiError(response.status, body.code, body.message);
    }   
    //T describes the type for TypeScript but does not validate JSON at runtime.
    return await response.json() as T;
}