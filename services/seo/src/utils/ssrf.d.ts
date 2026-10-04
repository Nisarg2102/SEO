export declare class SsrfError extends Error {
    constructor(reason: string);
}
export declare class UrlValidationError extends Error {
    constructor(reason: string);
}
export declare function validateUrl(rawUrl: string): Promise<URL>;
export declare function validateUrlStructureOnly(rawUrl: string, expectedHostname: string): URL;
