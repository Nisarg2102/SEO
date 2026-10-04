"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.UrlValidationError = exports.SsrfError = void 0;
exports.validateUrl = validateUrl;
exports.validateUrlStructureOnly = validateUrlStructureOnly;
const net = __importStar(require("node:net"));
const dns = __importStar(require("node:dns/promises"));
const PRIVATE_IPv4_RANGES = [
    [0x7f000000, 0xff000000, 127],
    [0xa9fe0000, 0xffff0000, 169],
    [0x0a000000, 0xff000000, 10],
    [0xac100000, 0xfff00000, 172],
    [0xc0a80000, 0xffff0000, 192],
    [0xc0000000, 0xffffff00, 192],
    [0x00000000, 0xff000000, 0],
    [0x64400000, 0xffc00000, 100],
    [0xc0000000, 0xffffff00, 192],
    [0xc6120000, 0xfffe0000, 198],
    [0xc6336400, 0xffffff00, 198],
    [0xcb007100, 0xffffff00, 203],
    [0xf0000000, 0xf0000000, 240],
    [0xffffffff, 0xffffffff, 255],
];
const ALLOWED_PORTS = new Set([80, 443]);
function ipv4ToInt(ip) {
    return ip.split('.').reduce((acc, octet) => (acc << 8) | parseInt(octet, 10), 0) >>> 0;
}
function isPrivateIPv4(ip) {
    const n = ipv4ToInt(ip);
    return PRIVATE_IPv4_RANGES.some(([base, mask]) => (n & mask) === (base & mask));
}
function isPrivateIPv6(ip) {
    const lower = ip.toLowerCase().replace(/^\[|\]$/g, '');
    return (lower === '::1' ||
        lower.startsWith('fc') ||
        lower.startsWith('fd') ||
        lower.startsWith('fe80') ||
        lower.startsWith('::ffff:') ||
        lower === '::' ||
        lower.startsWith('2001:db8'));
}
function assertPublicIp(ip) {
    if (net.isIPv4(ip)) {
        if (isPrivateIPv4(ip))
            throw new SsrfError(`Resolved to private IPv4: ${ip}`);
    }
    else if (net.isIPv6(ip)) {
        if (isPrivateIPv6(ip))
            throw new SsrfError(`Resolved to private IPv6: ${ip}`);
    }
}
class SsrfError extends Error {
    constructor(reason) {
        super(`SSRF protection: ${reason}`);
        this.name = 'SsrfError';
    }
}
exports.SsrfError = SsrfError;
class UrlValidationError extends Error {
    constructor(reason) {
        super(`URL validation: ${reason}`);
        this.name = 'UrlValidationError';
    }
}
exports.UrlValidationError = UrlValidationError;
async function validateUrl(rawUrl) {
    let parsed;
    try {
        parsed = new URL(rawUrl);
    }
    catch {
        throw new UrlValidationError(`Malformed URL: ${rawUrl}`);
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new UrlValidationError(`Protocol not allowed: ${parsed.protocol}`);
    }
    const hostname = parsed.hostname;
    if (net.isIPv4(hostname)) {
        assertPublicIp(hostname);
        return parsed;
    }
    if (net.isIPv6(hostname)) {
        assertPublicIp(hostname.replace(/^\[|\]$/g, ''));
        return parsed;
    }
    const lower = hostname.toLowerCase();
    if (lower === 'localhost' ||
        lower === 'metadata.google.internal' ||
        lower === '169.254.169.254' ||
        lower.endsWith('.internal') ||
        lower.endsWith('.local') ||
        lower.endsWith('.localhost')) {
        throw new SsrfError(`Hostname blocked: ${hostname}`);
    }
    if (parsed.port) {
        const port = parseInt(parsed.port, 10);
        if (!ALLOWED_PORTS.has(port)) {
            throw new UrlValidationError(`Port not allowed: ${parsed.port}`);
        }
    }
    let addresses;
    try {
        const resolved = await dns.resolve(hostname);
        addresses = resolved;
    }
    catch {
        throw new SsrfError(`DNS resolution failed for hostname: ${hostname}`);
    }
    for (const addr of addresses) {
        assertPublicIp(addr);
    }
    return parsed;
}
function validateUrlStructureOnly(rawUrl, expectedHostname) {
    let parsed;
    try {
        parsed = new URL(rawUrl);
    }
    catch {
        throw new UrlValidationError(`Malformed redirect URL: ${rawUrl}`);
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new UrlValidationError(`Redirect protocol not allowed: ${parsed.protocol}`);
    }
    if (parsed.hostname !== expectedHostname) {
        throw new SsrfError(`Redirect to different host blocked: ${parsed.hostname}`);
    }
    return parsed;
}
//# sourceMappingURL=ssrf.js.map