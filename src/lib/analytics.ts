"use client";

import posthog from "posthog-js";

// PostHog is optional: if NEXT_PUBLIC_POSTHOG_KEY is empty, every call here does nothing.
const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
let started = false;

export function initAnalytics() {
  if (!key || started || typeof window === "undefined") return;
  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
  });
  started = true;
}

export function track(event: string, props?: Record<string, unknown>) {
  if (started) posthog.capture(event, props);
}
