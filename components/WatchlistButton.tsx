"use client";
import React, { useMemo, useState, useEffect } from "react";
import { addToWatchlist, removeFromWatchlist, isStockInWatchlist } from "@/lib/actions/profile.actions";
import { toast } from "sonner";

type WatchlistButtonProps = {
  symbol: string;
  company?: string;
  isInWatchlist?: boolean;
  showTrashIcon?: boolean;
  type?: "button" | "icon";
  onWatchlistChange?: (symbol: string, isAdded: boolean) => void;
};

const WatchlistButton = ({
  symbol,
  company,
  isInWatchlist: initialIsInWatchlist,
  showTrashIcon = false,
  type = "button",
  onWatchlistChange,
}: WatchlistButtonProps) => {
  const [added, setAdded] = useState<boolean>(!!initialIsInWatchlist);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  // Sync with prop changes
  useEffect(() => {
    if (initialIsInWatchlist !== undefined) {
      setAdded(initialIsInWatchlist);
      setChecked(true);
    }
  }, [initialIsInWatchlist]);

  // Check watchlist status on mount if not provided
  useEffect(() => {
    if (initialIsInWatchlist === undefined && !checked) {
      const checkWatchlist = async () => {
        const result = await isStockInWatchlist(symbol);
        if (result.success) {
          setAdded(result.data);
          setChecked(true);
        }
      };
      checkWatchlist();
    }
  }, [symbol, initialIsInWatchlist, checked]);

  const label = useMemo(() => {
    if (type === "icon") return added ? "" : "";
    return added ? "Remove from Watchlist" : "Add to Watchlist";
  }, [added, type]);

  const handleClick = async () => {
    if (loading) return;

    setLoading(true);
    const next = !added;

    try {
      if (next) {
        const result = await addToWatchlist(symbol);
        if (result.success) {
          setAdded(true);
          onWatchlistChange?.(symbol, true);
          toast.success(`${symbol} added to watchlist`);
        } else {
          toast.error(result.error || "Failed to add to watchlist");
        }
      } else {
        const result = await removeFromWatchlist(symbol);
        if (result.success) {
          setAdded(false);
          onWatchlistChange?.(symbol, false);
          toast.success(`${symbol} removed from watchlist`);
        } else {
          toast.error(result.error || "Failed to remove from watchlist");
        }
      }
    } catch (error) {
      console.error("Error updating watchlist:", error);
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (type === "icon") {
    return (
      <button
        title={added ? `Remove ${symbol} from watchlist` : `Add ${symbol} to watchlist`}
        aria-label={added ? `Remove ${symbol} from watchlist` : `Add ${symbol} to watchlist`}
        className={`watchlist-icon-btn ${added ? "watchlist-icon-added" : ""}`}
        onClick={handleClick}
        disabled={loading}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill={added ? "#FACC15" : "none"}
          stroke="#FACC15"
          strokeWidth="1.5"
          className="watchlist-star"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.385a.563.563 0 00-.182-.557L3.04 10.385a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345l2.125-5.111z"
          />
        </svg>
      </button>
    );
  }

  return (
    <button 
      className={`watchlist-btn ${added ? "watchlist-remove" : ""}`} 
      onClick={handleClick}
      disabled={loading}
    >
      {showTrashIcon && added ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5 mr-2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-7 4v6m4-6v6m4-6v6" />
        </svg>
      ) : null}
      <span>{label}</span>
    </button>
  );
};

export default WatchlistButton;