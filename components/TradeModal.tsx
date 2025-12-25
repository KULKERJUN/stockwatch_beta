"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { buyAsset, sellAsset } from "@/lib/actions/trade.actions";
import { useTransition } from "react";
import { toast } from "sonner";

interface TradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "buy" | "sell";
  symbol: string;
  assetType?: "stock" | "crypto";
  cash?: string; // available balance
  maxSellQty?: string; // holdings qty for this symbol
  price?: number; // live price
}

export default function TradeModal({ open, onOpenChange, mode, symbol, assetType = "stock", cash = "0", maxSellQty = "0", price = 0 }: TradeModalProps) {
  const [quantity, setQuantity] = useState("1");
  const [isPending, startTransition] = useTransition();
  const qtyNum = Number(quantity) || 0;
  const total = (price || 0) * qtyNum;

  const handleConfirm = () => {
    startTransition(async () => {
      try {
        const action = mode === "buy" ? buyAsset : sellAsset;
        const res = await action({ symbol, quantity, assetType });
        if (!res.success) {
          toast.error(res.message || "Trade failed");
        } else {
          toast.success(res.message || "Success");
          onOpenChange(false);
        }
      } catch (e) {
        console.error(e);
        toast.error("Trade failed");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="capitalize">{mode} {symbol}</span>
            <span className="text-sm text-muted-foreground">{assetType.toUpperCase()}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Tabs defaultValue={assetType} className="w-full">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="stock">Stocks</TabsTrigger>
              <TabsTrigger value="crypto">Crypto</TabsTrigger>
            </TabsList>
            <TabsContent value="stock">
              <p className="text-sm text-muted-foreground">Trading as stock.</p>
            </TabsContent>
            <TabsContent value="crypto">
              <p className="text-sm text-muted-foreground">Trading as crypto.</p>
            </TabsContent>
          </Tabs>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Price</span>
            <span className="font-medium text-white">${price?.toFixed(2) ?? "—"}</span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Quantity</span>
              {mode === "buy" ? (
                <span>Max buy: {(Number(cash) / (price || 1)).toFixed(4)}</span>
              ) : (
                <span>Max sell: {maxSellQty}</span>
              )}
            </div>
            <Input
              type="number"
              min={0}
              step="0.0001"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="bg-slate-900 border-slate-800"
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total {mode === "buy" ? "Cost" : "Proceeds"}</span>
            <span className="font-semibold">${isFinite(total) ? total.toFixed(2) : "—"}</span>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isPending || qtyNum <= 0}>
            {isPending ? "Processing..." : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

