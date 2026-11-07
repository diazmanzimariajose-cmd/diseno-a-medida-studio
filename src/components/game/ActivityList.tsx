import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/lib/game/types";
import { Button } from "@/components/ui/button";

interface Props {
  conversations: Conversation[];
  activeId: string;
  onSelect: (id: string) => void;
  onCreate: () => void;
}

export function ActivityList(p: Props) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-display text-lg">Activities</h2>
        <Button variant="gold" size="sm" className="rounded-full" onClick={p.onCreate}>
          <Plus /> New
        </Button>
      </div>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:max-h-56 lg:flex-col lg:overflow-y-auto lg:overflow-x-visible">
        {p.conversations.map((c, i) => (
          <button
            key={c.id}
            type="button"
            onClick={() => p.onSelect(c.id)}
            className={cn(
              "flex min-w-48 shrink-0 items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors lg:min-w-0",
              c.id === p.activeId
                ? "border-gold bg-accent"
                : "border-border bg-secondary/50 hover:bg-accent",
            )}
          >
            <span
              className={cn(
                "grid size-7 shrink-0 place-items-center rounded-full text-xs font-extrabold",
                c.id === p.activeId
                  ? "bg-gold text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {i + 1}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold">{c.title}</span>
              <span className="block truncate text-[11px] text-muted-foreground">
                {c.topic} · {c.lines.length} lines
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
