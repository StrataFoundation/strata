import Document, { Html, Head, Main, NextScript } from "next/document";
import { GA_TRACKING_ID, IS_PRODUCTION } from "../constants";
import React from "react";
export default class MyDocument extends Document {
    render() {
        return (React.createElement(Html, null,
            React.createElement(Head, null, IS_PRODUCTION && (React.createElement(React.Fragment, null,
                React.createElement("script", { async: true, src: `https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}` }),
                React.createElement("script", { 
                    // eslint-disable-next-line react/no-danger
                    dangerouslySetInnerHTML: {
                        __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_TRACKING_ID}', {
              page_path: window.location.pathname,
            });
          `,
                    } })))),
            React.createElement("body", null,
                React.createElement(Main, null),
                React.createElement(NextScript, null))));
    }
}
//# sourceMappingURL=_document.js.map