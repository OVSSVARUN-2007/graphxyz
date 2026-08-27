/**
 * Graphxyz Shareable State URL Serializer & Deserializer
 * Encodes application equations, dimensions, parameters, and themes into URL hash.
 */

export interface ShareableState {
    mode: "equation" | "nlp";
    equation?: string;
    dimension?: string;
    parameters?: Record<string, number>;
    text?: string;
    theme?: "dark" | "light";
}

export function encodeShareableUrl(state: ShareableState): string {
    try {
        const jsonStr = JSON.stringify(state);
        const base64 = btoa(encodeURIComponent(jsonStr));
        const url = new URL(window.location.href);
        url.hash = `state=${base64}`;
        return url.toString();
    } catch (e) {
        console.error("Failed to encode shareable URL:", e);
        return window.location.href;
    }
}

export function decodeShareableUrl(): ShareableState | null {
    try {
        const hash = window.location.hash;
        if (!hash.includes("state=")) return null;
        const base64 = hash.split("state=")[1];
        if (!base64) return null;
        const jsonStr = decodeURIComponent(atob(base64));
        return JSON.parse(jsonStr) as ShareableState;
    } catch (e) {
        console.warn("Could not decode state from URL hash:", e);
        return null;
    }
}
