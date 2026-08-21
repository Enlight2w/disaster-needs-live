import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { RESPONSE_CATEGORY_OPTIONS, type ResponseCategory } from "@/lib/crisis";

type ReportDraft = {
  location: string;
  need: string;
  details: string;
  category: ResponseCategory;
};

export function NeedIntakeForm({ onComplete }: { onComplete: () => void }) {
  const [report, setReport] = useState<ReportDraft>({ location: "", need: "", details: "", category: "Other" });
  const [parserMessage, setParserMessage] = useState("Describe the requested item and the AI will suggest a category when you leave the field.");
  const lastParsedText = useRef("");
  const categorizeNeed = trpc.needs.categorize.useMutation({
    onSuccess: result => {
      setReport(current => ({ ...current, category: result.category as ResponseCategory }));
      setParserMessage(`${result.source === "ai" ? "AI" : "Backup rule"} suggestion: ${result.category} · ${result.confidence} confidence`);
    },
    onError: () => setParserMessage("Category suggestion is temporarily unavailable. Choose a category manually."),
  });

  const updateText = (field: "need" | "details", value: string) => {
    lastParsedText.current = "";
    setReport(current => ({ ...current, [field]: value }));
  };

  const categorizeDescription = () => {
    const description = `${report.need}\n${report.details}`.trim();
    if (description.length < 8 || categorizeNeed.isPending || description === lastParsedText.current) return;
    lastParsedText.current = description;
    setParserMessage("Reading the request and suggesting a category…");
    categorizeNeed.mutate({ description });
  };

  const submitReport = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!report.location.trim() || !report.need.trim()) {
      toast.error("Add a location and a specific need before sending.");
      return;
    }
    toast.success("Need submitted for verification", {
      description: "This prototype stores nothing externally; a live deployment would route this to a trained verifier.",
    });
    onComplete();
  };

  return (
    <>
      <div>
        <p className="font-mono text-[10px] font-semibold tracking-[0.12em] text-[#7bf1c9]">VERIFIED INTAKE · PROTOTYPE</p>
        <h2 className="mt-2 text-2xl font-bold tracking-[-0.05em]">Report a precise need</h2>
        <p className="mt-2 text-sm leading-5 text-slate-400">This prototype demonstrates the intake experience only. Do not submit life-critical requests here.</p>
      </div>
      <form className="mt-5 space-y-4" onSubmit={submitReport}>
        <label className="block space-y-2">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">Location or safe landmark</span>
          <Input value={report.location} onChange={event => setReport(current => ({ ...current, location: event.target.value }))} placeholder="e.g. East community shelter, block 4" className="h-11 border-white/10 bg-white/[0.04] text-white placeholder:text-slate-600" />
        </label>
        <label className="block space-y-2">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">Exact need</span>
          <Input value={report.need} onChange={event => updateText("need", event.target.value)} onBlur={categorizeDescription} placeholder="e.g. Insulin cooler with ice packs" className="h-11 border-white/10 bg-white/[0.04] text-white placeholder:text-slate-600" />
        </label>
        <label className="block space-y-2">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">Access notes (optional)</span>
          <Textarea value={report.details} onChange={event => updateText("details", event.target.value)} onBlur={categorizeDescription} placeholder="Safe contact route, transport constraint, preferred language…" className="min-h-24 border-white/10 bg-white/[0.04] text-white placeholder:text-slate-600" />
        </label>
        <div className="rounded-2xl border border-[#7bf1c9]/15 bg-[#7bf1c9]/[0.05] p-3.5" aria-live="polite">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 gap-2.5">
              <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-[#7bf1c9]/15 text-[#7bf1c9]"><Sparkles className="size-3.5" /></span>
              <div>
                <p className="font-mono text-[9px] font-semibold tracking-[0.1em] text-[#a9f8dc]">AI CATEGORY ASSIST</p>
                <p className="mt-1 text-[11px] leading-4 text-slate-400">{parserMessage}</p>
              </div>
            </div>
            <button type="button" onClick={categorizeDescription} disabled={categorizeNeed.isPending} className="shrink-0 text-[10px] font-semibold text-[#a9f8dc] transition-colors hover:text-white disabled:text-slate-600">
              {categorizeNeed.isPending ? "Reading…" : "Run again"}
            </button>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#7bf1c9]/10 pt-3">
            <label className="min-w-0 flex-1">
              <span className="sr-only">Suggested need category</span>
              <select value={report.category} onChange={event => setReport(current => ({ ...current, category: event.target.value as ResponseCategory }))} className="h-9 w-full rounded-lg border border-white/10 bg-[#081522] px-3 text-xs font-semibold text-white outline-none ring-[#7bf1c9]/40 focus:ring-2">
                {RESPONSE_CATEGORY_OPTIONS.filter(option => option !== "All").map(option => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
            <span className="font-mono text-[9px] text-slate-500">Review before submitting</span>
          </div>
        </div>
        <Button type="submit" className="h-11 w-full rounded-xl bg-[#7bf1c9] text-xs font-bold text-[#07111e] hover:bg-[#a5f8db]">Submit for verification <ArrowUpRight className="ml-2 size-4" /></Button>
      </form>
    </>
  );
}
