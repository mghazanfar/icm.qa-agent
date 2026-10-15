export type CheckInfo = {
  title: string;
  /** one-line meaning, shown in the row details */
  short: string;
  verifies: string;
  pass: string[];
  fails?: string;
  amber?: string;
  grey: string;
};

export const THRESHOLDS_FILE = "config/expected_values.yaml";

export const CHECKS_INFO: Record<string, CheckInfo> = {
  gtm: {
    title: "GTM integration",
    short: "Right Google Tag Manager container for the LP's regulator.",
    verifies: "The page loads the Google Tag Manager container for the LP's regulatory entity.",
    pass: [
      "FSA / CMA / SCB / Vietnam pages load GTM-KJ95KC.",
      "CYSEC (EU) pages load GTM-PBBCSCQL.",
      "ASIC (AU) pages load GTM-K3VV725Z.",
    ],
    fails: "The container is missing, or a different container is found (also notes if the page redirected elsewhere).",
    grey: "Domains with no tracking (e.g. iccampaign-cn.com).",
  },
  tracking: {
    title: "Tracking",
    short: "GTM really ran after cookies were accepted.",
    verifies: "The GTM script was actually delivered and executed on the page.",
    pass: [
      "The GTM script was delivered (HTTP 200), and",
      "the page's dataLayer received the gtm.js event, i.e. GTM really ran after cookies were accepted.",
      "Registry-specific tags (e.g. GA4 hits) are not verified yet.",
    ],
    grey: "No-tracking domains.",
  },
  cta_endpoint: {
    title: "CTA endpoints",
    short: "Register / login / open-account buttons go to a working IC Markets URL.",
    verifies:
      "Every main call-to-action button (links to the register / login / open-account endpoints, e.g. secure.ic.com/.../Account/Register) points to a reachable IC Markets URL.",
    pass: [
      "Each CTA responds with HTTP < 400 on an IC Markets host.",
      'Links with href="#" (dropdowns, quizzes) are not CTAs but are click-tested: they must open something.',
    ],
    fails: "There is no CTA, a CTA is broken / unreachable / points to a non-IC host, or a # button does nothing.",
    grey: "Not normally grey.",
  },
  cta_params: {
    title: "CTA tracking",
    short: "Every CTA carries a tracking hook.",
    verifies: "Every CTA carries a tracking hook so clicks can be attributed.",
    pass: [
      "A data-gtm / data-utm / data-track attribute, or",
      "utm_* parameters in the URL, or",
      "an onclick tracking call, or",
      "the CTA pushes to the dataLayer when clicked.",
    ],
    grey: "No-tracking domains.",
  },
  consistency: {
    title: "Consistency",
    short: "Leverage, instruments and minimum deposit agree with sibling LPs.",
    verifies:
      "Leverage (e.g. 1:500), instruments count and minimum deposit mentioned on this page agree with the other LPs of the same product and regulator. It only compares, and never asserts a \"correct\" value.",
    pass: ["The figures match those found on the other LPs of the same product + regulator."],
    grey: "It is the only LP for that product + regulator, so there is nothing to compare with.",
  },
  spelling: {
    title: "Spelling",
    short: "Visible English text checked against a dictionary and the IC Markets word list.",
    verifies: "Visible English text is checked against a dictionary plus the IC Markets custom word list.",
    pass: ["No unknown words."],
    amber:
      "Passed with a few unknown words (listed when you expand the row). Add legitimate ones to the custom dictionary.",
    fails: "More than 5 unknown words.",
    grey: "Not checked: only English (EN) pages are spell-checked; other languages have no reliable dictionary.",
  },
  performance: {
    title: "Load time",
    short: "Page renders and loads fast enough.",
    verifies: "Core loading speed of the page.",
    pass: [
      "LCP (largest contentful paint) <= 2.5 s",
      "TTFB (time to first byte) <= 800 ms",
      "Full load <= 5 s",
      "Best of up to 3 measurements for pages that fail the first one.",
    ],
    grey: "Not normally grey.",
  },
  mobile: {
    title: "Mobile",
    short: "Looks right on a phone (iPhone 14, 390x844).",
    verifies: "The page is rendered as an iPhone 14 (390x844) and its layout is inspected.",
    pass: [
      "A header/menu or top logo row is present, with a visible logo.",
      "At least one section/card is present.",
      "No sideways scrolling.",
      "No visible text colliding with other text (overlays and scroll animations are ignored).",
    ],
    grey: "Not normally grey.",
  },
  lag: {
    title: "Lag",
    short: "Page stays smooth while you use it.",
    verifies: "Smoothness while using the page.",
    pass: [
      "No main-thread task longer than 500 ms",
      "Interaction delay (INP) <= 200 ms (+10% margin)",
      "Layout shift (CLS) < 0.1",
    ],
    grey: "Not normally grey.",
  },
  redirect: {
    title: "Redirect",
    short: "The page opens exactly at the URL from the sheet.",
    verifies: "The agent opens the sheet URL (with sample tracking parameters) and compares it with the URL the browser ends on, including HTTP, meta and script redirects.",
    pass: [
      "The final URL has the same host and path as the requested one.",
      "No tracking parameter was dropped on the way.",
    ],
    fails: "The page lands on another host or path (the redirect chain with status codes is shown), or a redirect drops the tracking parameters.",
    amber: "Only the scheme or a trailing slash changed (a minor redirect), listed with the chain.",
    grey: "Not normally grey.",
  },
  param_pass: {
    title: "Param pass-through",
    short: "Ad tracking parameters reach the register / login links.",
    verifies:
      "Before each page is opened, sample ad parameters (utm_*, camp, placement ...) are appended to its URL. Every register / login CTA is then checked for the parameters that must be forwarded, as it is on the page and after a press / click (for links that are decorated on click).",
    pass: [
      "Every CTA carries the required parameters with the value that was sent (for example camp=91180 on normal LPs).",
      "Other forwarded and not forwarded parameters are listed in the detail.",
    ],
    fails: "A CTA lost, or changed the value of, a required parameter.",
    grey: "No tracking domains, pages without a CTA (checks 3 and 4 report that), or the feature is switched off.",
  },
  load: {
    title: "Page load",
    short: "The page opened at all.",
    verifies: "The page opened at all.",
    pass: ["HTTP 2xx / 3xx response."],
    fails: "e.g. 404, or blocked / unreachable (some LPs are geo-restricted).",
    grey: "Not normally grey.",
  },
};
