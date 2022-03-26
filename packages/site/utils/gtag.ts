import { GA_TRACKING_ID } from "@/constants";

// https://developers.google.com/analytics/devguides/collection/gtagjs/pages
export const pageview = (url: URL): void => {
  // @ts-ignore
  window.gtag!("config", GA_TRACKING_ID, {
    page_path: url,
  });
};

type GTagEvent = {
  action: string;
  category: string;
  label: string;
  value: number;
};

// https://developers.google.com/analytics/devguides/collection/gtagjs/events
export const event = ({ action, category, label, value }: GTagEvent): void => {
  // @ts-ignore
  window.gtag("event", action, {
    event_category: category,
    event_label: label,
    value,
  });
};
