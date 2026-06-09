import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { type Story } from "@/lib/stories";

export function StoryViewer({ story, onClose }: { story: Story; onClose: () => void }) {
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          onClose();
          return 0;
        }
        return p + (100 / 50); // 5 second duration
      });
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 text-white hover:text-white/80 p-2"
      >
        <X size={24} />
      </button>

      <div className="w-full max-w-md h-full md:max-h-screen md:h-auto aspect-[9/16]">
        <div className="h-1 bg-white/20 mb-2">
          <div
            className="h-full bg-white transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        <img
          src={story.image_url}
          alt="Story"
          className="w-full h-full object-cover rounded-2xl md:rounded-3xl"
        />
      </div>
    </div>
  );
}