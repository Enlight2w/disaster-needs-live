import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  CircleDashed,
  Clock3,
  HeartHandshake,
  Languages,
  PackageCheck,
  Radio,
  Share2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  RESPONSE_CATEGORY_OPTIONS,
  RESPONSE_NEEDS,
  TRANSLATION_LANGUAGES,
  type NeedStatus,
  type ResponseCategoryFilter,
  type ResponseNeed,
  type TranslationLanguage,
  buildShareMessage,
  filterResponseNeeds,
  nextNeedStatus,
} from "@/lib/crisis";

const statusMeta: Record<NeedStatus, { label: string; detail: string; icon: typeof CircleDashed; className: string }> = {
  posted: {
    label: "Open · unclaimed",
    detail: "Waiting for a responder",
    icon: CircleDashed,
    className: "bg-slate-400/10 text-slate-300 ring-slate-300/15",
  },
  in_progress: {
    label: "In progress",
    detail: "Response capacity is assigned",
    icon: Radio,
    className: "bg-[#7bf1c9]/10 text-[#a9f8dc] ring-[#7bf1c9]/20",
  },
  fulfilled: {
    label: "Fulfilled",
    detail: "Confirmed as addressed",
    icon: CheckCircle2,
    className: "bg-sky-300/10 text-sky-200 ring-sky-200/15",
  },
};

type NeedMatchingPanelProps = {
  category: ResponseCategoryFilter;
  onCategoryChange: (category: ResponseCategoryFilter) => void;
  onPostNeed: () => void;
};

export function NeedMatchingPanel({ category, onCategoryChange, onPostNeed }: NeedMatchingPanelProps) {
  const [statuses, setStatuses] = useState<Record<string, NeedStatus>>(() =>
    Object.fromEntries(RESPONSE_NEEDS.map(need => [need.id, need.status]))
  );
  const [translationLanguage, setTranslationLanguage] = useState<TranslationLanguage>("Spanish");
  const [translations, setTranslations] = useState<Record<string, { title: string; detail: string; language: TranslationLanguage }>>({});
  const [showTranslation, setShowTranslation] = useState<Record<string, boolean>>({});
  const [translatingId, setTranslatingId] = useState<string | null>(null);
  const translateNeed = trpc.needs.translate.useMutation();

  const matchingNeeds = useMemo(() => filterResponseNeeds(RESPONSE_NEEDS, category), [category]);

  const advanceStatus = (id: string) => {
    const current = statuses[id] ?? "posted";
    const next = nextNeedStatus(current);
    if (current === next) {
      toast.message("This request is already marked fulfilled.");
      return;
    }
    setStatuses(currentStatuses => ({ ...currentStatuses, [id]: next }));
    toast.success(next === "in_progress" ? "Response is now in progress" : "Request marked fulfilled", {
      description: "The status indicator updated immediately across this matching panel.",
    });
  };

  const shareNeed = async (need: ResponseNeed) => {
    const text = buildShareMessage(need);
    const url = `${window.location.origin}${window.location.pathname}#need-${need.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `Urgent need: ${need.title}`, text, url });
        toast.success("Share sheet opened", { description: "Choose a messaging or social platform to broadcast this request." });
        return;
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        toast.success("Request copied", { description: "Paste the prepared message into your preferred messaging or social platform." });
        return;
      }
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${text}\n${url}`)}`, "_blank", "noopener,noreferrer");
      toast.success("Share draft opened", { description: "A social share draft has opened in a new tab." });
    } catch (error) {
      if ((error as DOMException).name === "AbortError") return;
      toast.error("Could not open sharing", { description: "Copy the request details manually from this card." });
    }
  };

  const toggleTranslation = (need: ResponseNeed) => {
    const savedTranslation = translations[need.id];
    if (savedTranslation?.language === translationLanguage) {
      setShowTranslation(current => ({ ...current, [need.id]: !current[need.id] }));
      return;
    }

    setTranslatingId(need.id);
    translateNeed.mutate(
      { title: need.title, detail: need.detail, targetLanguage: translationLanguage },
      {
        onSuccess: result => {
          setTranslatingId(null);
          if (result.source === "fallback") {
            toast.error("Translation is temporarily unavailable", { description: "The original request remains visible for safe review." });
            return;
          }
          setTranslations(current => ({ ...current, [need.id]: { title: result.title, detail: result.detail, language: result.targetLanguage } }));
          setShowTranslation(current => ({ ...current, [need.id]: true }));
          toast.success(`Translated to ${result.targetLanguage}`, { description: "You can switch back to the original text at any time." });
        },
        onError: () => {
          setTranslatingId(null);
          toast.error("Translation is temporarily unavailable", { description: "The original request remains visible for safe review." });
        },
      }
    );
  };

  return (
    <div className="rounded-[28px] border border-white/10 bg-[#0b1928] p-6 sm:p-7">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
        <div>
          <p className="font-mono text-[10px] font-semibold tracking-[0.12em] text-[#f8bd61]">MATCH THE NEED</p>
          <h2 className="mt-2 text-2xl font-bold tracking-[-0.055em] text-white">Respond with the right help, faster.</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">Filter specific requests by category, translate a request on demand, then claim a response. Each status change is surfaced immediately in the active matching view.</p>
        </div>
        <Button onClick={onPostNeed} variant="outline" className="h-10 shrink-0 rounded-xl border-white/15 bg-white/5 text-xs font-semibold text-white hover:bg-white/10 hover:text-white">
          Post a need <HeartHandshake className="ml-2 size-3.5" />
        </Button>
      </div>

      <div className="mt-5 flex flex-wrap gap-1.5" aria-label="Filter matching needs by category">
        {RESPONSE_CATEGORY_OPTIONS.map(option => (
          <button
            key={option}
            type="button"
            aria-pressed={category === option}
            onClick={() => onCategoryChange(option)}
            className={cn(
              "rounded-full px-3 py-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.1em] ring-1 transition-colors",
              category === option ? "bg-[#7bf1c9] text-[#07111e] ring-[#7bf1c9]" : "bg-white/[0.035] text-slate-400 ring-white/10 hover:bg-white/[0.08] hover:text-slate-200"
            )}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] px-3 py-2.5">
        <span className="inline-flex items-center gap-2 text-[10px] text-slate-400"><Languages className="size-3.5 text-[#7bf1c9]" />Translate requests on demand</span>
        <label className="flex items-center gap-2">
          <span className="sr-only">Translation language</span>
          <select value={translationLanguage} onChange={event => setTranslationLanguage(event.target.value as TranslationLanguage)} className="h-7 rounded-md border border-white/10 bg-[#081522] px-2 text-[10px] font-semibold text-slate-200 outline-none ring-[#7bf1c9]/40 focus:ring-2">
            {TRANSLATION_LANGUAGES.map(language => <option key={language} value={language}>{language}</option>)}
          </select>
        </label>
      </div>

      <div className="mt-4 grid gap-2.5 md:grid-cols-2">
        {matchingNeeds.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/[0.13] bg-[#07131f]/55 p-6 text-center md:col-span-2" role="status">
            <CircleDashed className="mx-auto size-5 text-slate-500" />
            <p className="mt-3 text-sm font-semibold text-slate-200">No {category.toLowerCase()} requests are open right now.</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">Clear the filter to review every active response need, or post a verified request for this category.</p>
            <button type="button" onClick={() => onCategoryChange("All")} className="mt-4 text-xs font-semibold text-[#a9f8dc] transition-colors hover:text-white">Show all active needs</button>
          </div>
        ) : matchingNeeds.map(need => {
          const status = statuses[need.id] ?? need.status;
          const meta = statusMeta[status];
          const StatusIcon = meta.icon;
          const actionLabel = status === "posted" ? "Claim / respond" : status === "in_progress" ? "Mark fulfilled" : "Fulfilled";
          const translated = translations[need.id];
          const isTranslated = Boolean(translated && showTranslation[need.id]);
          const isHighUrgency = need.urgency === "high" && status !== "fulfilled";
          return (
            <article id={`need-${need.id}`} key={need.id} className={cn("group rounded-2xl border bg-[#07131f]/75 p-4 transition-colors hover:border-white/[0.15]", isHighUrgency ? "border-[#f8bd61]/35" : "border-white/[0.08]")}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[#f8bd61]">{need.category} · {need.quantity}{isHighUrgency ? " · HIGH URGENCY" : ""}</p>
                  <h3 className="mt-1.5 truncate text-sm font-bold tracking-[-0.02em] text-white">{isTranslated ? translated?.title : need.title}</h3>
                  <p className="mt-1 text-[11px] text-slate-500">{need.location}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button type="button" onClick={() => shareNeed(need)} className="grid size-7 place-items-center rounded-lg bg-white/[0.05] text-slate-300 transition-colors hover:bg-[#7bf1c9] hover:text-[#07111e]" aria-label={`Share urgent request for ${need.title}`} title="Share request">
                    <Share2 className="size-3.5" />
                  </button>
                  <PackageCheck className="size-4 shrink-0 text-[#7bf1c9]/70" />
                </div>
              </div>
              <p className="mt-3 min-h-10 text-[11px] leading-5 text-slate-400">{isTranslated ? translated?.detail : need.detail}</p>
              {isTranslated && <p className="mt-1 font-mono text-[9px] tracking-[0.08em] text-[#a9f8dc]">AI TRANSLATION · {translated?.language.toUpperCase()}</p>}
              <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/[0.07] pt-3">
                <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-1 font-mono text-[9px] font-semibold tracking-[0.06em] ring-1", meta.className)}>
                  <StatusIcon className={cn("size-3", status === "in_progress" && "animate-pulse")} />
                  {meta.label}
                </span>
                <span className="inline-flex items-center gap-1 font-mono text-[9px] text-slate-500"><Clock3 className="size-3" />{need.updatedAt}</span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="inline-flex items-center gap-1.5 text-[10px] text-slate-500"><Sparkles className="size-3 text-[#7bf1c9]" />{meta.detail}</p>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button type="button" onClick={() => toggleTranslation(need)} disabled={translatingId === need.id} className="inline-flex items-center gap-1 rounded-lg bg-white/[0.07] px-2 py-1.5 text-[10px] font-semibold text-slate-200 transition-colors hover:bg-white/[0.12] disabled:text-slate-500" aria-label={`${isTranslated ? "Show original" : `Translate request to ${translationLanguage}`} for ${need.title}`}>
                    <Languages className="size-3" />{translatingId === need.id ? "…" : isTranslated ? "Original" : "Translate"}
                  </button>
                  <button
                    type="button"
                    disabled={status === "fulfilled"}
                    onClick={() => advanceStatus(need.id)}
                    className="rounded-lg bg-white/[0.07] px-2.5 py-1.5 text-[10px] font-semibold text-slate-200 transition-colors hover:bg-[#7bf1c9] hover:text-[#07111e] disabled:cursor-default disabled:bg-white/[0.04] disabled:text-slate-500"
                  >
                    {actionLabel}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
