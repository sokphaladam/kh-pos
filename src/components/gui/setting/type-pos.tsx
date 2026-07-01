import { useSubscriptionCleanDummy } from "@/app/hooks/use-query-clean-dummy";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface TypePosValue {
  system_type: string;
  shared_order_draft: boolean;
  enviroment: string;
}

interface TypePosProps {
  value: string;
  onChange?: (value: string) => void;
}

const DEFAULT_VALUE: TypePosValue = {
  system_type: "",
  shared_order_draft: false,
  enviroment: "production",
};

const SYSTEM_TYPES = [
  { value: "MART", label: "Mart" },
  { value: "RESTAURANT", label: "Restaurant" },
  { value: "CINEMA", label: "Cinema" },
];

const ENVIRONMENTS = [
  { value: "production", label: "Production" },
  { value: "testing", label: "Testing" },
];

function parseValue(raw: string): TypePosValue {
  try {
    const parsed = raw ? JSON.parse(raw) : {};
    return {
      system_type: parsed.system_type ?? DEFAULT_VALUE.system_type,
      shared_order_draft:
        parsed.shared_order_draft ?? DEFAULT_VALUE.shared_order_draft,
      enviroment: parsed.enviroment ?? DEFAULT_VALUE.enviroment,
    };
  } catch {
    return { ...DEFAULT_VALUE };
  }
}

function CleanUpDummy() {
  const [shouldExecute, setShouldExecute] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  const { isLoading, progress, status, logs } =
    useSubscriptionCleanDummy(shouldExecute);

  // Scroll to bottom of terminal whenever a new log arrives
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="flex items-center gap-3">
      <Dialog
        open={shouldExecute}
        onOpenChange={(open) => {
          if (status === "running") return;
          setShouldExecute(open);
        }}
      >
        <DialogTrigger asChild>
          <Button
            size="sm"
            variant={"outline"}
            onClick={() => setShouldExecute(true)}
          >
            Clean up dummy data
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]  shadow-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-semibold tracking-tightflex items-center gap-2">
                {status === "processing" && (
                  <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                )}
                {status === "success" && (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                )}
                {status === "failed" && (
                  <AlertCircle className="h-5 w-5 text-rose-400" />
                )}
                Database Purge Pipeline
              </DialogTitle>
              <Badge
                className={`capitalize px-2.5 py-0.5 font-mono ${
                  status === "success"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : status === "failed"
                      ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                }`}
                variant="outline"
              >
                {status}
              </Badge>
            </div>
            <DialogDescription className="text-slate-400 text-sm pt-1">
              Running secure cascading drops on tables flagged with temporary
              testing metadata.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Progress Bar Display */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono text-slate-400">
                <span>SYNC_PROGRESS</span>
                <span className="font-bold text-white">{progress}%</span>
              </div>
              <Progress
                value={progress}
                className="h-2 bg-slate-800 [&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:to-indigo-500"
              />
            </div>

            {/* Simulated Log Output Window */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                Console Stream Output
              </label>
              <div className="h-32 w-full rounded-md border border-slate-800 bg-slate-900/50 bg-slate-950 text-slate-100 p-3 font-mono text-xs overflow-y-auto leading-relaxed scrollbar-thin scrollbar-thumb-slate-800">
                {isLoading ? (
                  <div className="flex items-center gap-2 text-slate-500 italic animate-pulse">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Spawning secure edge runtime connection...
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="text-slate-500">
                      [{new Date().toLocaleTimeString()}] Pipeline listener
                      initialized.
                    </div>
                    {/* Loop and list array output logs dynamically */}
                    {logs.map((log, index) => (
                      <div
                        key={index}
                        className="text-slate-300 flex items-start gap-1"
                      >
                        <span className="text-blue-500 select-none">&gt;</span>
                        <span
                          className={
                            index === logs.length - 1
                              ? "text-white font-medium"
                              : "text-slate-400"
                          }
                        >
                          {log}
                        </span>
                      </div>
                    ))}
                    {status === "completed" && (
                      <div className="text-emerald-400 font-semibold pt-1">
                        ✓ Process completed with status code 200.
                      </div>
                    )}
                    {status === "failed" && (
                      <div className="text-rose-400 font-semibold pt-1">
                        ❌ Pipeline crashed. Connection disconnected.
                      </div>
                    )}
                    {/* Dummy element anchor to trigger auto scrolling downward */}
                    <div ref={logEndRef} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function TypePos({ value, onChange }: TypePosProps) {
  const parsed = parseValue(value);

  const handleChange = (patch: Partial<TypePosValue>) => {
    onChange?.(JSON.stringify({ ...parsed, ...patch }));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-gray-700">System Type</Label>
        <Select
          value={parsed.system_type}
          onValueChange={(v) => {
            const input = {
              system_type: v,
              shared_order_draft: parsed.shared_order_draft,
              enviroment: parsed.enviroment,
            };
            if (v === "RESTAURANT") {
              input.shared_order_draft = true;
            }
            handleChange(input);
          }}
        >
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Select system type" />
          </SelectTrigger>
          <SelectContent>
            {SYSTEM_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-gray-700">Enviroment</Label>
        <Select
          value={parsed.enviroment}
          onValueChange={(v) => {
            const input = {
              system_type: parsed.system_type,
              shared_order_draft: parsed.shared_order_draft,
              enviroment: v,
            };
            if (v === "RESTAURANT") {
              input.shared_order_draft = true;
            }
            handleChange(input);
          }}
        >
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Select system type" />
          </SelectTrigger>
          <SelectContent>
            {ENVIRONMENTS.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {["MART", "CINEMA"].includes(parsed.system_type) ? (
        <div className="flex items-center gap-3">
          <Switch
            id="shared-order-draft"
            checked={parsed.shared_order_draft}
            onCheckedChange={(checked) =>
              handleChange({ shared_order_draft: checked })
            }
            disabled={parsed.system_type === "RESTAURANT"}
          />
          <Label
            htmlFor="shared-order-draft"
            className="text-sm font-medium text-gray-700 cursor-pointer"
          >
            {parsed.shared_order_draft
              ? "Shared order draft enabled"
              : "Shared order draft disabled"}
          </Label>
        </div>
      ) : (
        <div></div>
      )}
      <CleanUpDummy />
    </div>
  );
}
