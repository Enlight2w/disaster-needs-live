import { useEffect, useMemo, useRef, useState } from "react";
import { MapView } from "@/components/Map";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { NeedIntakeForm } from "@/components/NeedIntakeForm";
import { NeedMatchingPanel } from "@/components/NeedMatchingPanel";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  ChevronDown,
  Crosshair,
  Droplets,
  HeartHandshake,
  Languages,
  MapPin,
  Navigation,
  Radio,
  ShieldCheck,
  Sparkles,
  Truck,
  UsersRound,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import {
  CRISIS_INCIDENTS,
  type CrisisIncident,
  type IncidentCategory,
  type IncidentFilter,
  filterIncidents,
  formatCoordinates,
  incidentIdsForCategory,
  urgentIncidentIds,
  type ResponseCategoryFilter,
  stageAmberAlert,
} from "@/lib/crisis";

const backgroundImage = "/manus-storage/disaster-needs-diverse-community-hero_da1aaee6.jpg";

const needStyles: Record<IncidentCategory, { icon: typeof Droplets; className: string }> = {
  Water: { icon: Droplets, className: "bg-sky-400/10 text-sky-200 ring-sky-300/15" },
  Health: { icon: HeartHandshake, className: "bg-pink-400/10 text-pink-200 ring-pink-300/15" },
  Shelter: { icon: UsersRound, className: "bg-violet-400/10 text-violet-200 ring-violet-300/15" },
  Power: { icon: Zap, className: "bg-amber-300/10 text-amber-200 ring-amber-200/15" },
  Transport: { icon: Truck, className: "bg-emerald-300/10 text-emerald-200 ring-emerald-200/15" },
  Language: { icon: Languages, className: "bg-cyan-300/10 text-cyan-100 ring-cyan-200/15" },
};

function NeedChip({ need }: { need: IncidentCategory }) {
  const { icon: Icon, className } = needStyles[need];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-[0.03em] ring-1", className)}>
      <Icon className="size-3" />
      {need}
    </span>
  );
}

export default function Home() {
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRegistryRef = useRef<Record<string, google.maps.marker.AdvancedMarkerElement>>({});
  const [activeId, setActiveId] = useState(CRISIS_INCIDENTS[0].id);
  const [filter, setFilter] = useState<IncidentFilter>("all");
  const [needCategory, setNeedCategory] = useState<ResponseCategoryFilter>("All");
  const [reportOpen, setReportOpen] = useState(false);
  const [amberAlert, setAmberAlert] = useState(false);

  const visibleIncidents = useMemo(() => filterIncidents(CRISIS_INCIDENTS, filter), [filter]);
  const visibleIncidentIds = useMemo(() => incidentIdsForCategory(CRISIS_INCIDENTS, needCategory), [needCategory]);
  const highUrgencyIncidentIds = useMemo(() => urgentIncidentIds(), []);
  const activeIncident = CRISIS_INCIDENTS.find(incident => incident.id === activeId) ?? CRISIS_INCIDENTS[0];

  useEffect(() => {
    if (!visibleIncidents.some(incident => incident.id === activeId)) {
      setActiveId(visibleIncidents[0]?.id ?? CRISIS_INCIDENTS[0].id);
    }
  }, [activeId, visibleIncidents]);

  useEffect(() => {
    const visibleCategoryIncident = CRISIS_INCIDENTS.find(incident => visibleIncidentIds.has(incident.id));
    if (visibleCategoryIncident && !visibleIncidentIds.has(activeId)) {
      setActiveId(visibleCategoryIncident.id);
    }
    Object.entries(markerRegistryRef.current).forEach(([incidentId, marker]) => {
      marker.map = visibleIncidentIds.has(incidentId) ? mapRef.current : null;
    });
  }, [activeId, visibleIncidentIds]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.panTo(activeIncident.coordinates);
    map.setZoom(6);
  }, [activeIncident]);

  const focusIncident = (incident: CrisisIncident) => {
    setActiveId(incident.id);
  };

  const handleMapReady = (map: google.maps.Map) => {
    mapRef.current = map;
    map.setMapTypeId("hybrid");
    map.setOptions({
      mapTypeControlOptions: { position: google.maps.ControlPosition.TOP_RIGHT },
      zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_CENTER },
      streetViewControl: false,
      fullscreenControl: false,
    });

    CRISIS_INCIDENTS.forEach(incident => {
      const pin = document.createElement("button");
      pin.type = "button";
      pin.className = cn(
        "disaster-map-pin",
        incident.severity === "critical" && "disaster-map-pin--critical",
        highUrgencyIncidentIds.has(incident.id) && "disaster-map-pin--urgent",
      );
      pin.setAttribute("aria-label", `View ${incident.place} incident`);
      pin.innerHTML = `<span></span>`;
      pin.addEventListener("click", () => focusIncident(incident));

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: incident.coordinates,
        title: `${incident.place}: ${incident.priorityNeed}`,
        content: pin,
      });
      markerRegistryRef.current[incident.id] = marker;
      marker.map = visibleIncidentIds.has(incident.id) ? map : null;
    });
  };

  const activateAmberAlert = () => {
    setAmberAlert(current => stageAmberAlert(current));
    toast.warning("Amber alert activated", {
      description: "The selected incident is now surfaced to the local response queue in this prototype.",
    });
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#07111e] text-[#edf7f6] selection:bg-[#7bf1c9] selection:text-[#07111e]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-28 top-48 size-[34rem] rounded-full bg-cyan-400/8 blur-[140px]" />
        <div className="absolute right-[-12rem] top-[-8rem] size-[34rem] rounded-full bg-amber-300/8 blur-[140px]" />
        <div className="crisis-grid absolute inset-0 opacity-40" />
      </div>

      <header className="relative z-20 border-b border-white/10 bg-[#07111e]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between gap-4 px-5 lg:px-8">
          <a href="#board" className="group flex items-center gap-3" aria-label="Disaster Needs Live home">
            <span className="grid size-9 place-items-center rounded-xl bg-[#7bf1c9] text-[#07111e] shadow-[0_0_0_5px_rgba(123,241,201,0.08)] transition-transform duration-200 group-hover:scale-105">
              <Radio className="size-5" strokeWidth={2.5} />
            </span>
            <span className="leading-none">
              <span className="block text-[15px] font-extrabold tracking-[-0.05em] text-white">Disaster Needs Live</span>
              <span className="mt-1 block font-mono text-[9px] font-medium tracking-[0.14em] text-[#7bf1c9]/80">LOCAL SIGNAL NETWORK</span>
            </span>
          </a>

          <nav className="hidden items-center gap-7 text-xs font-medium text-slate-300 md:flex">
            <a className="transition-colors hover:text-white" href="#board">Live board</a>
            <a className="transition-colors hover:text-white" href="#how-it-works">How it works</a>
            <a className="transition-colors hover:text-white" href="#safety">Safety standard</a>
          </nav>

          <Button
            onClick={() => setReportOpen(true)}
            className="h-10 rounded-xl bg-[#f8bd61] px-4 text-xs font-bold text-[#201607] shadow-[0_8px_26px_rgba(248,189,97,0.18)] transition-all hover:bg-[#ffd38a] active:scale-[0.97]"
          >
            <MapPin className="mr-2 size-3.5" />
            Report a need
          </Button>
        </div>
      </header>

      <main id="board" className="relative z-10 mx-auto max-w-[1440px] px-5 pb-16 pt-6 lg:px-8 lg:pt-10">
        <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#0b1928] shadow-[0_26px_70px_rgba(0,0,0,0.25)]">
          <div
            className="absolute inset-y-0 right-0 hidden w-[52%] bg-cover bg-right opacity-70 lg:block"
            style={{ backgroundImage: `url(${backgroundImage})` }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#0b1928_0%,rgba(11,25,40,0.96)_40%,rgba(11,25,40,0.30)_100%)]" aria-hidden="true" />
          <div className="relative grid gap-8 px-6 py-8 sm:px-10 lg:grid-cols-[minmax(0,0.88fr)_minmax(340px,0.52fr)] lg:items-end lg:px-12 lg:py-12">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#7bf1c9]/15 bg-[#7bf1c9]/10 px-3 py-1.5 font-mono text-[10px] font-semibold tracking-[0.12em] text-[#a9f8dc]">
                <span className="relative flex size-1.5"><span className="absolute inline-flex size-full animate-ping rounded-full bg-[#7bf1c9] opacity-75" /><span className="relative inline-flex size-1.5 rounded-full bg-[#7bf1c9]" /></span>
                BOARD ONLINE · PROTOTYPE MODE
              </div>
              <h1 className="max-w-2xl text-balance text-4xl font-extrabold leading-[0.96] tracking-[-0.065em] text-white sm:text-5xl lg:text-[66px]">
                Local needs,<br />
                <span className="text-[#7bf1c9]">visible in time.</span>
              </h1>
              <p className="mt-5 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
                A shared crisis board where communities can make the exact help they need visible to responders, mutual-aid teams, and donors—before effort gets duplicated or delayed.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button
                  onClick={() => document.getElementById("active-incidents")?.scrollIntoView({ behavior: "smooth" })}
                  className="h-11 rounded-xl bg-[#7bf1c9] px-5 text-xs font-bold text-[#07111e] transition-all hover:bg-[#a5f8db] active:scale-[0.97]"
                >
                  Explore active needs <ArrowUpRight className="ml-2 size-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => document.getElementById("safety")?.scrollIntoView({ behavior: "smooth" })}
                  className="h-11 rounded-xl border-white/15 bg-white/5 px-5 text-xs font-semibold text-white hover:bg-white/10 hover:text-white active:scale-[0.97]"
                >
                  <ShieldCheck className="mr-2 size-4 text-[#f8bd61]" />
                  Verification standard
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5 rounded-2xl border border-white/10 bg-[#081522]/55 p-3.5 backdrop-blur-md lg:max-w-md lg:justify-self-end">
              {[
                ["04", "illustrative incidents"],
                ["06", "need categories"],
                ["<1h", "last board update"],
              ].map(([value, label]) => (
                <div key={label} className="min-w-0 border-r border-white/10 pr-2 last:border-r-0">
                  <p className="font-mono text-xl font-semibold tracking-[-0.08em] text-white">{value}</p>
                  <p className="mt-1 text-[9px] leading-3 text-slate-400">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="relative min-h-[600px] overflow-hidden rounded-[28px] border border-white/10 bg-[#0a1725] shadow-[0_26px_70px_rgba(0,0,0,0.20)] lg:min-h-[670px]">
            <MapView className="crisis-map absolute inset-0 h-full w-full" initialCenter={{ lat: 8, lng: 22 }} initialZoom={2} onMapReady={handleMapReady} />
            <div className="crisis-map-fallback pointer-events-none absolute inset-0 z-[1] overflow-hidden" aria-hidden="true">
              <span className="map-continent map-continent--americas" />
              <span className="map-continent map-continent--eurasia" />
              <span className="map-continent map-continent--africa" />
              <span className="map-continent map-continent--australia" />
              <svg className="absolute inset-0 size-full" viewBox="0 0 1000 600" preserveAspectRatio="none">
                <path d="M 122 174 C 260 104, 410 238, 533 196 S 764 92, 898 165" fill="none" stroke="rgba(123,241,201,0.22)" strokeWidth="1.3" strokeDasharray="5 7" />
                <path d="M 210 420 C 342 344, 481 446, 612 352 S 788 260, 916 327" fill="none" stroke="rgba(248,189,97,0.22)" strokeWidth="1.3" strokeDasharray="5 7" />
                <g className={cn("map-fallback-pin", highUrgencyIncidentIds.has("beira") && "map-fallback-pin--urgent")} style={{ opacity: visibleIncidentIds.has("beira") ? 1 : 0.12 }}><circle cx="615" cy="303" r="5" fill="#f8bd61" /><circle cx="615" cy="303" r="13" fill="none" stroke="rgba(248,189,97,0.50)" strokeWidth="1" /></g>
                <g className={cn("map-fallback-pin", highUrgencyIncidentIds.has("mamuju") && "map-fallback-pin--urgent")} style={{ opacity: visibleIncidentIds.has("mamuju") ? 1 : 0.12 }}><circle cx="746" cy="350" r="4" fill="#7bf1c9" /><circle cx="746" cy="350" r="10" fill="none" stroke="rgba(123,241,201,0.42)" strokeWidth="1" /></g>
                <circle cx="652" cy="433" r="4" fill="#f8bd61" opacity={visibleIncidentIds.has("cebu") ? 1 : 0.12} /><circle cx="236" cy="384" r="4" fill="#7bf1c9" opacity={visibleIncidentIds.has("peru") ? 1 : 0.12} />
              </svg>
              <span className="map-coordinate map-coordinate--one">34.839°E</span>
              <span className="map-coordinate map-coordinate--two">118.889°E</span>
              <span className="map-coordinate map-coordinate--three">80.633°W</span>
              <span className="absolute bottom-7 right-7 font-mono text-[9px] font-semibold tracking-[0.16em] text-[#7bf1c9]/45">LOCATION SIGNAL CANVAS</span>
            </div>
            <div className="pointer-events-none absolute inset-0 z-[2] bg-[linear-gradient(180deg,rgba(7,17,30,0.24)_0%,rgba(7,17,30,0)_24%,rgba(7,17,30,0.55)_100%)]" />

            <div className="absolute left-4 right-4 top-4 z-10 flex flex-col justify-between gap-3 sm:left-6 sm:right-6 sm:flex-row">
              <div className="rounded-2xl border border-white/10 bg-[#081522]/90 p-2 shadow-xl backdrop-blur-xl">
                <div className="flex items-center gap-1">
                  {(["all", "critical", "watch"] as IncidentFilter[]).map(item => (
                    <button
                      type="button"
                      key={item}
                      onClick={() => setFilter(item)}
                      className={cn(
                        "rounded-xl px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.10em] transition-colors",
                        filter === item ? "bg-white/10 text-white" : "text-slate-400 hover:text-slate-200"
                      )}
                    >
                      {item === "all" ? "All signals" : item}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#f8bd61]/20 bg-[#251b0f]/90 px-4 py-3 shadow-xl backdrop-blur-xl sm:justify-start">
                <span className="flex size-7 items-center justify-center rounded-lg bg-[#f8bd61]/15 text-[#ffd486]"><Crosshair className="size-3.5" /></span>
                <span>
                  <span className="block font-mono text-[9px] font-semibold tracking-[0.12em] text-[#ffd486]">SATELLITE-READY MAP</span>
                  <span className="mt-0.5 block text-[10px] text-slate-400">{needCategory === "All" ? "All matching locations are visible" : `Showing ${needCategory.toLowerCase()} locations only`}</span>
                </span>
              </div>
            </div>

            <div className="absolute bottom-4 left-4 right-4 z-10 rounded-[18px] border border-white/10 bg-[#081522]/95 p-3 shadow-2xl backdrop-blur-xl sm:bottom-6 sm:left-6 sm:right-auto sm:w-[360px] sm:p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="mb-2 flex items-center gap-2">
                    <span className={cn("size-2 rounded-full", activeIncident.severity === "critical" ? "bg-[#f8bd61] shadow-[0_0_12px_#f8bd61]" : "bg-[#7bf1c9]")} />
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Selected location</span>
                  </div>
                  <h2 className="truncate text-base font-bold tracking-[-0.035em] text-white">{activeIncident.place}, {activeIncident.country}</h2>
                  <p className="mt-1 text-xs leading-5 text-slate-400">{activeIncident.summary}</p>
                </div>
                <button type="button" onClick={() => focusIncident(activeIncident)} className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/5 text-[#a9f8dc] transition-colors hover:bg-white/10" aria-label="Recenter selected location">
                  <Navigation className="size-4" />
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">{activeIncident.needs.map(need => <NeedChip key={need} need={need} />)}</div>
              <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 font-mono text-[9px] text-slate-500">
                <span>{formatCoordinates(activeIncident.coordinates)}</span>
                <span>{activeIncident.signal}</span>
              </div>
            </div>
          </div>

          <aside id="active-incidents" className="rounded-[28px] border border-white/10 bg-[#0b1928] p-4 shadow-[0_26px_70px_rgba(0,0,0,0.20)] sm:p-5 xl:min-h-[670px]">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] font-semibold tracking-[0.12em] text-[#7bf1c9]">RESPONSE QUEUE</p>
                <h2 className="mt-1 text-xl font-bold tracking-[-0.05em] text-white">Active incidents</h2>
              </div>
              <span className="rounded-full bg-[#f8bd61]/10 px-2.5 py-1 font-mono text-[10px] font-semibold text-[#ffd486] ring-1 ring-[#f8bd61]/15">{visibleIncidents.length} shown</span>
            </div>

            <div className="space-y-2.5">
              {visibleIncidents.map(incident => (
                <button
                  type="button"
                  key={incident.id}
                  onClick={() => focusIncident(incident)}
                  className={cn(
                    "group w-full rounded-2xl border p-3.5 text-left transition-all duration-200",
                    activeId === incident.id ? "border-[#7bf1c9]/35 bg-[#7bf1c9]/[0.07] shadow-[0_12px_28px_rgba(0,0,0,0.16)]" : "border-white/[0.07] bg-[#07131f]/60 hover:border-white/15 hover:bg-white/[0.035]"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn("size-1.5 rounded-full", incident.severity === "critical" ? "bg-[#f8bd61]" : "bg-[#7bf1c9]")} />
                        <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.11em] text-slate-500">{incident.type}</span>
                      </div>
                      <p className="mt-1.5 truncate text-sm font-bold tracking-[-0.025em] text-white">{incident.place}</p>
                      <p className="mt-0.5 text-[11px] text-slate-400">{incident.country} · {incident.verifiedAt}</p>
                    </div>
                    <ArrowUpRight className={cn("mt-1 size-4 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5", activeId === incident.id ? "text-[#7bf1c9]" : "text-slate-500")} />
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/[0.07] pt-2.5">
                    <span className="truncate text-[11px] font-medium text-slate-300">{incident.priorityNeed}</span>
                    <span className="shrink-0 font-mono text-[9px] text-slate-500">{incident.peopleReached}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-[#7bf1c9]/10 bg-[#7bf1c9]/[0.045] p-3.5">
              <div className="flex gap-3">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-[#7bf1c9]" />
                <p className="text-[11px] leading-5 text-slate-400"><strong className="font-semibold text-slate-200">Prototype boundary.</strong> Incidents on this board are illustrative. Real deployments must show source, timestamp, verifier, and safe escalation route.</p>
              </div>
            </div>
          </aside>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[1.22fr_0.78fr]">
          <NeedMatchingPanel category={needCategory} onCategoryChange={setNeedCategory} onPostNeed={() => setReportOpen(true)} />

          <div className={cn("rounded-[28px] border p-6 sm:p-7", amberAlert ? "border-[#f8bd61]/40 bg-[#2a1d0f]" : "border-white/10 bg-[#101b29]") }>
            <div className="flex items-center justify-between gap-4">
              <div className="grid size-10 place-items-center rounded-xl bg-[#f8bd61]/15 text-[#ffd486]"><AlertTriangle className="size-5" /></div>
              <span className={cn("rounded-full px-2.5 py-1 font-mono text-[9px] font-semibold tracking-[0.1em] ring-1", amberAlert ? "bg-[#f8bd61]/15 text-[#ffd486] ring-[#f8bd61]/30" : "bg-white/5 text-slate-400 ring-white/10")}>{amberAlert ? "ALERT ACTIVE" : "LOCAL ESCALATION"}</span>
            </div>
            <h2 className="mt-5 text-2xl font-bold tracking-[-0.055em] text-white">Need a faster response?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">Activate an amber alert to prioritize the selected need for the regional response team. In production, this action requires human review and contact verification.</p>
            <Button
              onClick={activateAmberAlert}
              disabled={amberAlert}
              className="mt-5 h-11 w-full rounded-xl bg-[#f8bd61] text-xs font-bold text-[#261908] hover:bg-[#ffd38a] disabled:cursor-default disabled:bg-[#f8bd61]/35 disabled:text-[#f8bd61]"
            >
              {amberAlert ? <><Check className="mr-2 size-4" /> Amber alert staged</> : <><AlertTriangle className="mr-2 size-4" /> Activate amber alert</>}
            </Button>
          </div>
        </section>

        <section id="how-it-works" className="mt-16 grid gap-8 border-t border-white/10 pt-12 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <p className="font-mono text-[10px] font-semibold tracking-[0.12em] text-[#7bf1c9]">THE OPERATING LOOP</p>
            <h2 className="mt-3 max-w-sm text-3xl font-bold leading-[1.02] tracking-[-0.06em] text-white">Bring field knowledge and response capacity into the same frame.</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["01", "Post the exact need", "Local teams add a location, needed item, quantity, access notes, and preferred contact channel."],
              ["02", "Verify before matching", "A trained response desk checks source, timing, safeguarding concerns, and duplicate reports."],
              ["03", "Coordinate the delivery", "Responders and donors see one shared request with a clear owner, route, and close-out status."],
            ].map(([number, title, body]) => (
              <div key={number} className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
                <p className="font-mono text-xs font-semibold text-[#f8bd61]">{number}</p>
                <h3 className="mt-8 text-sm font-bold text-white">{title}</h3>
                <p className="mt-2 text-xs leading-5 text-slate-400">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="safety" className="mt-12 rounded-[26px] border border-[#7bf1c9]/15 bg-[#7bf1c9]/[0.055] px-6 py-6 sm:flex sm:items-center sm:justify-between sm:gap-8 sm:px-8">
          <div className="flex gap-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#7bf1c9]/15 text-[#7bf1c9]"><ShieldCheck className="size-5" /></span>
            <div>
              <h2 className="text-sm font-bold text-white">Designed for responsible coordination, not emergency dispatch.</h2>
              <p className="mt-1.5 max-w-3xl text-xs leading-5 text-slate-400">Never rely on this prototype for urgent life-safety decisions. A production service needs verified sources, consent-aware publishing, local safeguarding partnerships, and clear access to official emergency services.</p>
            </div>
          </div>
          <a href="#board" className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#a9f8dc] transition-colors hover:text-white sm:mt-0">Back to live board <ChevronDown className="size-3.5 -rotate-90" /></a>
        </section>
      </main>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="border-white/10 bg-[#0d1b2a] text-white sm:max-w-[520px]">
          <NeedIntakeForm onComplete={() => setReportOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
