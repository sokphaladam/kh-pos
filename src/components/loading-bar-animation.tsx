import { cn } from "@/lib/utils";

export default function LoadingBar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        `absolute bottom-0 left-0 w-full h-[2px] bg-gray-300 overflow-hidden`,
        className
      )}
    >
      <div className="h-full bg-blue-500 animate-loading-bar" />
    </div>
  );
}
