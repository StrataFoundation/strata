import "../styles/globals.css";
import React, { useEffect } from "react";
import "../utils/bufferFill";
import { DefaultSeo } from "next-seo";
import { useRouter } from "next/router";
import * as gtag from "../utils/gtag";
import { Toaster } from "react-hot-toast";
import SEO from "../next-seo.config";
import { Providers } from "../components/Providers";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { IS_PRODUCTION } from "../constants";
const App = ({ Component, pageProps }) => {
    const router = useRouter();
    useEffect(() => {
        const handleRouteChange = (url) => {
            /* invoke analytics function only for production */
            if (IS_PRODUCTION)
                gtag.pageview(url);
        };
        router.events.on("routeChangeComplete", handleRouteChange);
        return () => {
            router.events.off("routeChangeComplete", handleRouteChange);
        };
    }, [router.events]);
    return (React.createElement(Providers, null,
        React.createElement(DefaultSeo, Object.assign({}, SEO)),
        React.createElement(Header, null),
        React.createElement(Component, Object.assign({}, pageProps)),
        React.createElement(Toaster, { position: "bottom-center", containerStyle: {
                margin: "auto",
                width: "420px",
            } }),
        React.createElement(Footer, null)));
};
export default App;
//# sourceMappingURL=_app.js.map