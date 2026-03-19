// PostHog removed for security — no analytics data leaves the extension.
// All exported functions are no-op stubs so callers don't break.

export function initPostHog() {
    // no-op
}

export function trackEvent(_event: string, _properties = {}) {
    // no-op
}

export async function trackEventSW(_event: string, _properties: Record<string, any> = {}) {
    // no-op
    return true;
}
