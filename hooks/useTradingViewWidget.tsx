'use client';

import { useEffect, useRef } from "react";

const useTradingViewWidget = (scriptUrl: string, config: Record<string, unknown>, height = 600) => {
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Reset container on every render so the widget is always re-initialised
        container.innerHTML = `<div class="tradingview-widget-container__widget" style="width: 100%; height: ${height}px;"></div>`;

        const script = document.createElement("script");
        script.type = "text/javascript";
        script.src = scriptUrl;
        script.async = true;
        script.text = JSON.stringify(config);

        container.appendChild(script);

        return () => {
            container.innerHTML = "";
        };
    }, [scriptUrl, config, height]);

    return containerRef;
};

export default useTradingViewWidget;