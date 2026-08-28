import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { BookOpen, Library, PlayCircle, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { SearchResponse, SearchResultItem } from "@/types/api";

const EMPTY: SearchResponse = { courses: [], modules: [], lessons: [] };

function ResultGroup({
  label,
  icon: Icon,
  items,
  onSelect,
}: {
  label: string;
  icon: typeof BookOpen;
  items: SearchResultItem[];
  onSelect: (item: SearchResultItem) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-1">
      <p className="px-2 text-xs font-medium text-muted-foreground">{label}</p>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect(item)}
          className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-accent"
        >
          <Icon className="size-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{item.title}</p>
            {item.description && (
              <p className="truncate font-body text-xs text-muted-foreground">
                {item.description}
              </p>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

export function SearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResponse>(EMPTY);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebouncedValue(query, 300);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setResults(EMPTY);
  }, [open]);

  useEffect(() => {
    const q = debouncedQuery.trim();
    if (q.length < 2) {
      setResults(EMPTY);
      return;
    }
    setLoading(true);
    api<SearchResponse>(`/search?q=${encodeURIComponent(q)}`)
      .then(setResults)
      .catch(() => setResults(EMPTY))
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  function goTo(path: string) {
    onOpenChange(false);
    navigate(path);
  }

  const hasResults =
    results.courses.length > 0 || results.modules.length > 0 || results.lessons.length > 0;
  const trimmedQuery = query.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-lg">
        <DialogHeader className="border-b px-4 py-3">
          <DialogTitle className="sr-only">Search</DialogTitle>
          <div className="flex items-center gap-2">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search courses, modules, lessons…"
              className="border-none px-0 shadow-none focus-visible:ring-0"
            />
          </div>
        </DialogHeader>

        <div className="max-h-96 space-y-3 overflow-y-auto p-2">
          {trimmedQuery.length < 2 ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              Type at least 2 characters to search.
            </p>
          ) : loading ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">Searching…</p>
          ) : !hasResults ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              No results for "{trimmedQuery}".
            </p>
          ) : (
            <>
              <ResultGroup
                label="Courses"
                icon={Library}
                items={results.courses}
                onSelect={(item) => goTo(`/courses/${item.id}`)}
              />
              <ResultGroup
                label="Modules"
                icon={BookOpen}
                items={results.modules}
                onSelect={(item) => goTo(`/modules/${item.id}`)}
              />
              <ResultGroup
                label="Lessons"
                icon={PlayCircle}
                items={results.lessons}
                onSelect={(item) => goTo(`/lessons/${item.id}`)}
              />
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
