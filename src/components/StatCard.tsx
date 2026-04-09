import { cn } from "../lib/cs";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export function StatCard({
  title,
  value,
  delta,
  negative,
  icon: Icon,
}: {
  title: string;
  value: string;
  delta?: string;
  negative?: boolean;
  icon?: React.ElementType;
}) {
  return (
    <div className="card p-5 transition hover:bg-white/5">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-white/60">{title}</div>

        {Icon && (
          <div className="rounded-lg bg-white/5 p-2 text-white/60">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>

      {/* VALUE */}
      <div className="mt-3 flex items-end justify-between">
        <div className="text-3xl md:text-4xl font-extrabold tracking-tight text-white/90">
          {value}
        </div>

        {/* DELTA */}
        {delta && (
          <div
            className={cn(
              "flex items-center gap-1 text-sm font-semibold",
              negative ? "text-red-400" : "text-emerald-400"
            )}
          >
            {negative ? (
              <ArrowDownRight className="h-4 w-4" />
            ) : (
              <ArrowUpRight className="h-4 w-4" />
            )}
            {delta}
          </div>
        )}
      </div>
    </div>
  );
}