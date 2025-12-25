import { Suspense } from "react";
import CompareStocksClient from "@/components/CompareStocksClient";

export default function CompareStocksPage() {
  return (
    <div className="flex min-h-screen p-4 md:p-6 lg:p-8">
      <section className="w-full space-y-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-100">
            Compare Stocks
          </h1>
          <p className="text-sm text-gray-400 max-w-2xl">
            Select two symbols to compare their current prices, daily performance, and
            charts side-by-side. Data updates automatically without reloading the page.
          </p>
        </header>
        <Suspense fallback={<div className="text-gray-400">Loading comparison...</div>}>
          <CompareStocksClient />
        </Suspense>
      </section>
    </div>
  );
}


