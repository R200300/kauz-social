import { useRef, useState, type ReactNode } from "react";
import { Spinner } from "./Spinner";

const THRESHOLD = 70;
const MAX = 110;

export function PullToRefresh({
  onRefresh,
  children,
}: {
  onRefresh: () => Promise<void> | void;
  children: ReactNode;
}) {
  const startY = useRef<number | null>(null);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  function onTouchStart(e: React.TouchEvent) {
    if (window.scrollY > 0 || refreshing) return;
    startY.current = e.touches[0].clientY;
  }
  function onTouchMove(e: React.TouchEvent) {
    if (startY.current == null) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0) {
      setPull(Math.min(MAX, dy * 0.55));
    }
  }
  async function onTouchEnd() {
    if (startY.current == null) return;
    startY.current = null;
    if (pull >= THRESHOLD) {
      setRefreshing(true);
      setPull(THRESHOLD);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPull(0);
      }
    } else {
      setPull(0);
    }
  }

  const visible = pull > 4 || refreshing;
  const progress = Math.min(1, pull / THRESHOLD);

  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <div
        className="pointer-events-none flex items-center justify-center overflow-hidden transition-[height] duration-200"
        style={{ height: refreshing ? THRESHOLD : pull }}
        aria-hidden={!visible}
      >
        {visible && (
          <div className="flex flex-col items-center gap-1 pt-2">
            {refreshing ? (
              <Spinner size={22} />
            ) : (
              <span
                className="inline-block h-5 w-5 rounded-full border-2 border-primary/25 border-t-primary"
                style={{ transform: `rotate(${progress * 360}deg)` }}
              />
            )}
            <span className="text-[10px] uppercase tracking-wider text-primary/80">
              {refreshing ? "Refreshing" : progress >= 1 ? "Release" : "Pull"}
            </span>
          </div>
        )}
      </div>
      <div
        style={{ transform: `translateY(${refreshing ? 0 : pull * 0.1}px)` }}
        className="transition-transform"
      >
        {children}
      </div>
    </div>
  );
}