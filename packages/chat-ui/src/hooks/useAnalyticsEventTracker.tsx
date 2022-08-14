import * as gtag from "../utils/gtag";

export const useAnalyticsEventTracker = (category="Chat") => {
  const eventTracker = ({
    action = "undefined action", 
    label = "undefined label",
    value = 0,
  }) => {
    gtag.event({category, action, label, value});
  }
  return eventTracker;
}