'use client';

import { useEffect, useMemo, useState } from "react";
import TradingViewWidget from "@/components/TradingViewWidget";
import { BASELINE_WIDGET_CONFIG, CANDLE_CHART_WIDGET_CONFIG } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type PriceSnapshot = {
  price?: number;
  changePercent?: number;
  high?: number;
  low?: number;
  volume?: number;
  marketStatus?: "OPEN" | "CLOSED" | "UNKNOWN";
  lastUpdate?: string;
  error?: string;
};

type SymbolState = {
  symbol: string;
  display: string;
  data?: PriceSnapshot;
  loading: boolean;
};

const EMPTY_SNAPSHOT: PriceSnapshot = {
  marketStatus: "UNKNOWN",
};

const scriptBase = "https://s3.tradingview.com/external-embedding/embed-widget-";

async function fetchQuote(symbol: string): Promise<PriceSnapshot> {
  try {
    const res = await fetch(`/api/stocks?symbol=${encodeURIComponent(symbol)}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return { ...EMPTY_SNAPSHOT, error: "Unable to load quote data" };
    }

    const json = await res.json();

    if (!json || !json.data) {
      return { ...EMPTY_SNAPSHOT, error: "No data for symbol" };
    }

    const d = json.data;

    return {
      price: typeof d.currentPrice === "number" ? d.currentPrice : undefined,
      changePercent:
        typeof d.changePercent === "number" ? d.changePercent : undefined,
      high: typeof d.high === "number" ? d.high : undefined,
      low: typeof d.low === "number" ? d.low : undefined,
      volume: typeof d.volume === "number" ? d.volume : undefined,
      marketStatus: d.marketStatus ?? "UNKNOWN",
      lastUpdate: d.lastUpdate ?? undefined,
    };
  } catch {
    return { ...EMPTY_SNAPSHOT, error: "Failed to fetch data" };
  }
}

const formatChangeClass = (value?: number) => {
  if (value == null) return "";
  if (value > 0) return "text-emerald-400";
  if (value < 0) return "text-red-400";
  return "text-gray-300";
};

const formatChangeLabel = (value?: number) => {
  if (value == null) return "–";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
};

const formatNumber = (value?: number, fractionDigits = 2) => {
  if (value == null) return "–";
  return value.toLocaleString(undefined, {
    maximumFractionDigits: fractionDigits,
  });
};

const formatVolume = (value?: number) => {
  if (value == null) return "–";
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(2)}K`;
  }
  return value.toLocaleString();
};

const CompareStocksClient = () => {
  const [left, setLeft] = useState<SymbolState>({
    symbol: "AAPL",
    display: "AAPL",
    loading: true,
  });
  const [right, setRight] = useState<SymbolState>({
    symbol: "TSLA",
    display: "TSLA",
    loading: true,
  });
  const [editingLeft, setEditingLeft] = useState("AAPL");
  const [editingRight, setEditingRight] = useState("TSLA");
  const [error, setError] = useState<string | null>(null);

  // Poll for live prices every 30s
  useEffect(() => {
    let cancelled = false;

    const loadBoth = async () => {
      setLeft((prev) => ({ ...prev, loading: true }));
      setRight((prev) => ({ ...prev, loading: true }));
      setError(null);

      const [l, r] = await Promise.all([
        fetchQuote(left.symbol),
        fetchQuote(right.symbol),
      ]);

      if (cancelled) return;

      setLeft((prev) => ({ ...prev, data: l, loading: false }));
      setRight((prev) => ({ ...prev, data: r, loading: false }));

      if (left.symbol.toUpperCase() === right.symbol.toUpperCase()) {
        setError("You are comparing the same symbol on both sides.");
      }
    };

    loadBoth();

    const id = setInterval(loadBoth, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [left.symbol, right.symbol]);

  const handleApply = () => {
    const leftSym = editingLeft.trim().toUpperCase();
    const rightSym = editingRight.trim().toUpperCase();

    if (!leftSym || !rightSym) {
      setError("Both symbols are required.");
      return;
    }

    setLeft((prev) => ({
      ...prev,
      symbol: leftSym,
      display: leftSym,
      data: undefined,
    }));
    setRight((prev) => ({
      ...prev,
      symbol: rightSym,
      display: rightSym,
      data: undefined,
    }));

    if (leftSym === rightSym) {
      setError("You are comparing the same symbol on both sides.");
    } else {
      setError(null);
    }
  };

  const comparisonConfig = useMemo(() => {
    const primary = left.symbol.toUpperCase() || "AAPL";
    const secondary = right.symbol.toUpperCase() || "TSLA";

    return {
      ...BASELINE_WIDGET_CONFIG(primary),
      // TradingView expects compareSymbols as an array of symbol strings,
      // not objects. If both sides are the same symbol, we skip comparison.
      compareSymbols:
        primary === secondary
          ? []
          : [secondary],
      title: `${primary} vs ${secondary} (Relative Performance)`,
    };
  }, [left.symbol, right.symbol]);

  const leftChartConfig = useMemo(
    () => CANDLE_CHART_WIDGET_CONFIG(left.symbol),
    [left.symbol]
  );
  const rightChartConfig = useMemo(
    () => CANDLE_CHART_WIDGET_CONFIG(right.symbol),
    [right.symbol]
  );

  return (
    <div className="flex flex-col gap-6">
      <Card className="bg-neutral-950/60 border-neutral-800">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <CardTitle className="text-base md:text-lg text-gray-100">
            Symbols
          </CardTitle>
          <div className="flex flex-col gap-3 w-full md:flex-row md:items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Left Symbol
              </label>
              <Input
                value={editingLeft}
                onChange={(e) => setEditingLeft(e.target.value)}
                placeholder="e.g. AAPL"
                className="uppercase"
                autoCapitalize="characters"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Right Symbol
              </label>
              <Input
                value={editingRight}
                onChange={(e) => setEditingRight(e.target.value)}
                placeholder="e.g. TSLA"
                className="uppercase"
                autoCapitalize="characters"
              />
            </div>
            <div className="md:w-auto">
              <Button
                type="button"
                onClick={handleApply}
                className="w-full mt-2 md:mt-0"
              >
                Apply
              </Button>
            </div>
          </div>
        </CardHeader>
        {error && (
          <CardContent className="pt-0">
            <p className="text-xs text-amber-400">{error}</p>
          </CardContent>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-neutral-950/60 border-neutral-800">
          <CardHeader>
            <CardTitle className="flex items-baseline justify-between gap-2">
              <span className="text-gray-100 text-lg">
                {left.display || left.symbol || "Left"}
              </span>
              <span className="text-sm text-gray-400">
                {left.data?.marketStatus === "CLOSED" && "Market closed"}
                {left.data?.marketStatus === "OPEN" && "Market open"}
                {left.data?.marketStatus === "UNKNOWN" && "Market status unknown"}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-2xl font-semibold text-gray-100">
                  {left.data?.price != null
                    ? `$${formatNumber(left.data.price)}`
                    : left.loading
                    ? "Loading..."
                    : "–"}
                </p>
                <p
                  className={`text-sm font-medium ${formatChangeClass(
                    left.data?.changePercent
                  )}`}
                >
                  {formatChangeLabel(left.data?.changePercent)}
                </p>
              </div>
              <div className="text-xs text-gray-400 text-right">
                <p>
                  Day range:{" "}
                  <span className="text-gray-200">
                    {formatNumber(left.data?.low)} –{" "}
                    {formatNumber(left.data?.high)}
                  </span>
                </p>
                <p>
                  Volume:{" "}
                  <span className="text-gray-200">
                    {formatVolume(left.data?.volume)}
                  </span>
                </p>
                {left.data?.lastUpdate && (
                  <p className="mt-1">
                    Last update:{" "}
                    <span className="text-gray-300">
                      {left.data.lastUpdate}
                    </span>
                  </p>
                )}
              </div>
            </div>

            <TradingViewWidget
              scriptUrl={`${scriptBase}advanced-chart.js`}
              config={leftChartConfig}
              className="custom-chart"
              height={420}
            />
          </CardContent>
        </Card>

        <Card className="bg-neutral-950/60 border-neutral-800">
          <CardHeader>
            <CardTitle className="flex items-baseline justify-between gap-2">
              <span className="text-gray-100 text-lg">
                {right.display || right.symbol || "Right"}
              </span>
              <span className="text-sm text-gray-400">
                {right.data?.marketStatus === "CLOSED" && "Market closed"}
                {right.data?.marketStatus === "OPEN" && "Market open"}
                {right.data?.marketStatus === "UNKNOWN" &&
                  "Market status unknown"}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-2xl font-semibold text-gray-100">
                  {right.data?.price != null
                    ? `$${formatNumber(right.data.price)}`
                    : right.loading
                    ? "Loading..."
                    : "–"}
                </p>
                <p
                  className={`text-sm font-medium ${formatChangeClass(
                    right.data?.changePercent
                  )}`}
                >
                  {formatChangeLabel(right.data?.changePercent)}
                </p>
              </div>
              <div className="text-xs text-gray-400 text-right">
                <p>
                  Day range:{" "}
                  <span className="text-gray-200">
                    {formatNumber(right.data?.low)} –{" "}
                    {formatNumber(right.data?.high)}
                  </span>
                </p>
                <p>
                  Volume:{" "}
                  <span className="text-gray-200">
                    {formatVolume(right.data?.volume)}
                  </span>
                </p>
                {right.data?.lastUpdate && (
                  <p className="mt-1">
                    Last update:{" "}
                    <span className="text-gray-300">
                      {right.data.lastUpdate}
                    </span>
                  </p>
                )}
              </div>
            </div>

            <TradingViewWidget
              scriptUrl={`${scriptBase}advanced-chart.js`}
              config={rightChartConfig}
              className="custom-chart"
              height={420}
            />
          </CardContent>
        </Card>
      </div>

      <Card className="bg-neutral-950/60 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-base md:text-lg text-gray-100">
            Relative Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TradingViewWidget
            scriptUrl={`${scriptBase}advanced-chart.js`}
            config={comparisonConfig}
            className="custom-chart"
            height={480}
          />
          {left.symbol.toUpperCase() === right.symbol.toUpperCase() && (
            <p className="mt-2 text-xs text-amber-400">
              Select two different symbols to see a proper comparison chart.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CompareStocksClient;


