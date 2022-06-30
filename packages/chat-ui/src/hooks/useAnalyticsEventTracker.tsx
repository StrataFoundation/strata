import React from "react";
import ReactGA from "react-ga";

export const useAnalyticsEventTracker = (category="Chat") => {
  const eventTracker = ({
    action = "undefined action", 
    label = "undefined label",
    value = 0,
  }) => {
    //@ts-ignore
    if (window.ga) { // object is defined on window when analytics is initialized
        ReactGA.event({category, action, label, value});
    }
  }
  return eventTracker;
}