import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import {
  CheckCircle2,
  BadgeCheck,
  CircleDashed,
  Clock3,
  HeartHandshake,
  Languages,
  MessageCircle,
  ExternalLink,
  FileCheck2,
  Phone,
  PackageCheck,
  Radio,
  Share2,
  Sparkles,
  Upload,
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
  buildQuickReplyMessage,
  coordinationPathwaysForNeed,
  filterResponseNeeds,
  nextNeedStatus,
  validateEvidenceFile,
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
  const [replyNeed, setReplyNeed] = useState<ResponseNeed | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [selectedEvidence, setSelectedEvidence] = useState<File | null>(null);
  const [evidenceByNeed, setEvidenceByNeed] = useState<Record<string, { key: string; url: string; fileName: string }>>({});
  const [committedNeedIds, setCommittedNeedIds] = useState<Record<string, boolean>>({});
  const evidenceInputRef = useRef<HTMLInputElement>(null);
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const translateNeed = trpc.needs.translate.useMutation();
  const uploadEvidence = trpc.needs.uploadEvidence.useMutation();
  const commitResponder = trpc.needs.commit.useMutation();

  const matchingNeeds = useMemo(() => filterResponseNeeds(RESPONSE_NEEDS, category), [category]);
  const commitmentQuery = trpc.needs.commitmentStatus.useQuery(
    { needId: replyNeed?.id ?? "inactive" },
    { enabled: Boolean(replyNeed) }
  );
  const commitmentSummariesQuery = trpc.needs.commitmentStatuses.useQuery({
    needIds: RESPONSE_NEEDS.map(need => need.id),
  });

  useEffect(() => {
    if (replyNeed && commitmentQuery.data?.currentResponderCommitted) {
      setCommittedNeedIds(current => ({ ...current, [replyNeed.id]: true }));
    }
  }, [replyNeed, commitmentQuery.data?.currentResponderCommitted]);

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

  const openQuickReply = (need: ResponseNeed) => {
    setReplyNeed(need);
    setReplyDraft(buildQuickReplyMessage(need));
    setSelectedEvidence(null);
  };

  const copyQuickReply = async () => {
    if (!replyDraft.trim()) return;
    try {
      await navigator.clipboard.writeText(replyDraft);
      toast.success("Coordination reply copied", { description: "Use a verified contact route before sharing details or arranging a handover." });
    } catch {
      toast.error("Could not copy the reply", { description: "Select and copy the message manually." });
    }
  };

  const pickEvidence = () => {
    if (!isAuthenticated) {
      toast.message("Sign in to attach evidence", { description: "Credential and capacity files are restricted to signed-in responders." });
      startLogin();
      return;
    }
    evidenceInputRef.current?.click();
  };

  const onEvidenceSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const validation = validateEvidenceFile(file);
    if (!validation.valid) {
      toast.error("Evidence file not accepted", { description: validation.reason });
      event.target.value = "";
      return;
    }
    setSelectedEvidence(file);
    toast.success("Evidence attached for review", { description: "The file will upload securely only when you record your commitment." });
  };

  const fileToBase64 = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read selected file"));
    reader.onload = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl !== "string") return reject(new Error("Could not read selected file"));
      resolve(dataUrl.split(",")[1] ?? "");
    };
    reader.readAsDataURL(file);
  });

  const recordCommitment = async () => {
    if (!replyNeed) return;
    if (!isAuthenticated) {
      toast.message("Sign in to record a commitment", { description: "Only authenticated responders can create a fulfillment commitment." });
      startLogin();
      return;
    }

    try {
      let evidence = evidenceByNeed[replyNeed.id];
      if (selectedEvidence) {
        const base64 = await fileToBase64(selectedEvidence);
        const uploaded = await uploadEvidence.mutateAsync({
          needId: replyNeed.id,
          fileName: selectedEvidence.name,
          contentType: selectedEvidence.type as "image/jpeg" | "image/png" | "image/webp" | "application/pdf",
          base64,
        });
        evidence = { key: uploaded.key, url: uploaded.url, fileName: uploaded.fileName };
        setEvidenceByNeed(current => ({ ...current, [replyNeed.id]: evidence! }));
        setSelectedEvidence(null);
      }

      const result = await commitResponder.mutateAsync({
        needId: replyNeed.id,
        evidenceKey: evidence?.key,
        evidenceUrl: evidence?.url,
      });
      setCommittedNeedIds(current => ({ ...current, [replyNeed.id]: result.currentResponderCommitted }));
      await utils.needs.commitmentStatus.invalidate({ needId: replyNeed.id });
      toast.success("Responder commitment recorded", { description: "The commitment tracker now shows this request as backed by a signed-in responder." });
    } catch (error) {
      toast.error("Could not record commitment", { description: "The request remains unchanged. Review the file and try again." });
    }
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
          const persistedCommitment = commitmentSummariesQuery.data?.find(summary => summary.needId === need.id);
          const responderCommitted = Boolean(committedNeedIds[need.id] || persistedCommitment?.committedCount);
          const committedCount = persistedCommitment?.committedCount ?? 0;
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
                <span className="flex items-center gap-2"><span className="inline-flex items-center gap-1 font-mono text-[9px] text-slate-500"><Clock3 className="size-3" />{need.updatedAt}</span>{responderCommitted && <span className="inline-flex items-center gap-1 rounded-full bg-[#7bf1c9]/10 px-2 py-1 font-mono text-[8px] font-semibold text-[#a9f8dc] ring-1 ring-[#7bf1c9]/20"><BadgeCheck className="size-2.5" />{committedCount || 1} COMMITTED</span>}</span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="inline-flex items-center gap-1.5 text-[10px] text-slate-500"><Sparkles className="size-3 text-[#7bf1c9]" />{meta.detail}</p>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button type="button" onClick={() => openQuickReply(need)} className="inline-flex items-center gap-1 rounded-lg bg-[#f8bd61]/10 px-2 py-1.5 text-[10px] font-semibold text-[#ffd486] transition-colors hover:bg-[#f8bd61] hover:text-[#261908]" aria-label={`Prepare a coordination reply for ${need.title}`}>
                    <MessageCircle className="size-3" />Reply
                  </button>
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

      <Dialog open={Boolean(replyNeed)} onOpenChange={open => { if (!open) setReplyNeed(null); }}>
        <DialogContent className="border-white/10 bg-[#0d1b2a] text-white sm:max-w-[590px]">
          <DialogHeader>
            <DialogTitle className="text-2xl tracking-[-0.05em]">Coordinate a safe reply</DialogTitle>
            <DialogDescription className="leading-5 text-slate-400">This prepares a message for <span className="font-semibold text-slate-200">{replyNeed?.title ?? "this request"}</span>. It does not send a message or reveal unverified personal contact details.</DialogDescription>
          </DialogHeader>

          <section className="rounded-xl border border-[#7bf1c9]/15 bg-[#7bf1c9]/[0.045] p-3" aria-label="Fulfillment commitment tracker">
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-[10px] font-semibold tracking-[0.1em] text-[#a9f8dc]">FULFILLMENT TRACKER</span>
              <span className="font-mono text-[10px] text-slate-500">{commitmentQuery.data?.committedCount ?? 0} signed-in responder{(commitmentQuery.data?.committedCount ?? 0) === 1 ? "" : "s"}</span>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <div className="rounded-lg bg-[#07131f]/70 p-2.5"><span className="block font-mono text-[9px] text-[#a9f8dc]">01 · PREPARED</span><span className="mt-1 block text-[10px] text-slate-400">Coordination reply drafted</span></div>
              <div className={cn("rounded-lg p-2.5", commitmentQuery.data?.currentResponderCommitted ? "bg-[#7bf1c9]/10" : "bg-[#07131f]/70")}><span className={cn("block font-mono text-[9px]", commitmentQuery.data?.currentResponderCommitted ? "text-[#a9f8dc]" : "text-slate-500")}>02 · COMMITTED</span><span className="mt-1 block text-[10px] text-slate-400">{commitmentQuery.data?.currentResponderCommitted ? "Your signed-in commitment is recorded" : "Awaiting responder commitment"}</span></div>
              <div className="rounded-lg bg-[#07131f]/70 p-2.5"><span className="block font-mono text-[9px] text-slate-500">03 · FULFILLED</span><span className="mt-1 block text-[10px] text-slate-400">Requires local confirmation</span></div>
            </div>
          </section>

          <textarea value={replyDraft} onChange={event => setReplyDraft(event.target.value)} className="min-h-28 w-full resize-y rounded-xl border border-white/10 bg-white/[0.04] p-3 text-xs leading-5 text-slate-200 outline-none ring-[#7bf1c9]/40 focus:ring-2" aria-label="Prepared coordination reply" />

          <div className="rounded-xl border border-[#f8bd61]/20 bg-[#f8bd61]/[0.07] p-3">
            <p className="text-[11px] leading-5 text-[#ffe2ae]">Confirm the requester’s identity and current status through an official local route before sharing personal, medical, or location-sensitive information.</p>
          </div>

          <section className="rounded-xl border border-white/[0.10] bg-white/[0.025] p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><p className="text-xs font-semibold text-slate-100">Credential or capacity evidence</p><p className="mt-1 text-[10px] leading-4 text-slate-500">JPG, PNG, WEBP, or PDF · 5 MB maximum · uploaded only after sign-in and commitment.</p></div>
              <input ref={evidenceInputRef} onChange={onEvidenceSelected} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="sr-only" />
              <Button type="button" variant="outline" onClick={pickEvidence} className="h-9 rounded-lg border-white/15 bg-white/5 px-3 text-[10px] font-semibold text-slate-100 hover:bg-white/10 hover:text-white"><Upload className="mr-1.5 size-3.5" />Attach file</Button>
            </div>
            {(selectedEvidence || (replyNeed && evidenceByNeed[replyNeed.id])) && <div className="mt-3 flex items-center gap-2 border-t border-white/[0.08] pt-3 text-[10px] text-[#a9f8dc]"><FileCheck2 className="size-3.5" />{selectedEvidence ? `${selectedEvidence.name} · ready to upload with commitment` : `${evidenceByNeed[replyNeed!.id]!.fileName} · securely attached`}</div>}
          </section>

          <div className="space-y-2">
            <p className="font-mono text-[10px] font-semibold tracking-[0.1em] text-[#7bf1c9]">OFFICIAL COORDINATION PATHWAYS</p>
            {replyNeed && coordinationPathwaysForNeed(replyNeed).map(pathway => (
              <a key={pathway.id} href={pathway.href} target={pathway.kind === "phone" ? undefined : "_blank"} rel={pathway.kind === "phone" ? undefined : "noreferrer"} className="group flex items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] p-3 transition-colors hover:border-[#7bf1c9]/30 hover:bg-[#7bf1c9]/[0.05]">
                <span className="min-w-0"><span className="block text-xs font-semibold text-slate-100">{pathway.label}</span><span className="mt-0.5 block text-[10px] leading-4 text-slate-500">{pathway.detail}</span></span>
                {pathway.kind === "phone" ? <Phone className="size-4 shrink-0 text-[#f8bd61]" /> : <ExternalLink className="size-4 shrink-0 text-[#7bf1c9] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />}
              </a>
            ))}
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setReplyNeed(null)} className="h-10 rounded-xl border-white/15 bg-white/5 text-xs font-semibold text-white hover:bg-white/10 hover:text-white">Close</Button>
            <Button onClick={copyQuickReply} className="h-10 rounded-xl bg-[#7bf1c9] text-xs font-bold text-[#07111e] hover:bg-[#a5f8db]"><MessageCircle className="mr-2 size-3.5" />Copy coordination reply</Button>
            <Button onClick={recordCommitment} disabled={uploadEvidence.isPending || commitResponder.isPending || commitmentQuery.data?.currentResponderCommitted} className="h-10 rounded-xl bg-[#f8bd61] text-xs font-bold text-[#261908] hover:bg-[#ffd38a] disabled:bg-[#f8bd61]/35 disabled:text-[#f8bd61]"><BadgeCheck className="mr-2 size-3.5" />{commitmentQuery.data?.currentResponderCommitted ? "Commitment recorded" : uploadEvidence.isPending || commitResponder.isPending ? "Recording…" : "Record commitment"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
