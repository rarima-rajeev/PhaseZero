"use client";

import posthog from "posthog-js";

// Visitor analytics. The PostHog project key is public by design (it ships in browser code), so it has a fallback here.
const key = process.env.NEXT_PUBLIC_POSTHOG_KEY || "phc_A7AQUNuHDWgP92hxthbkLJE53fGP2VnVBM3EbGgW9tKy";
let started = false;

export function initAnalytics() {
  if (!key || started || typeof window === "undefined") return;
  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
    defaults: "2025-05-24", // page views and page leaves, including client-side navigation
  });
  started = true;
}

export function track(event: string, props?: Record<string, unknown>) {
  if (started) posthog.capture(event, props);
}
