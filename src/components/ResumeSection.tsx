"use client";

import * as React from "react";
import { File, GraduationCap, Briefcase, FileStack, FileCheck2, Copy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type EducationItem = {
  institution: string;
  degree: string;
  start: string; // e.g., "2018"
  end: string; // e.g., "2022" or "Present"
  highlights?: string[];
};

type ExperienceItem = {
  company: string;
  role: string;
  start: string;
  end: string;
  highlights?: string[];
};

type ProjectItem = {
  title: string;
  description?: string;
  reportCid?: string;
  datasetCid?: string;
  otherFiles?: { label: string; cid: string }[];
};

export type ResumeSectionProps = {
  className?: string;
  style?: React.CSSProperties;
  heading?: string;
  subheading?: string;
  resumeCid?: string; // IPFS CID for PDF resume
  ipfsGateway?: string; // e.g., https://ipfs.io/ipfs/
  education?: EducationItem[];
  experience?: ExperienceItem[];
  projects?: ProjectItem[];
};

type GatewayStatus = "checking" | "online" | "degraded" | "offline";

function getIpfsUrl(gateway: string, cid: string) {
  const base = gateway.endsWith("/") ? gateway : gateway + "/";
  return `${base}${cid}`;
}

function Dot({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn("h-2 w-2 rounded-full bg-primary ring-2 ring-primary/20", className)} />;
}

function SectionTitle({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-foreground/90">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <h3 className="text-base sm:text-lg font-semibold">{title}</h3>
    </div>
  );
}

export default function ResumeSection({
  className,
  style,
  heading = "Resume",
  subheading = "Education, experience, and on-chain files",
  resumeCid,
  ipfsGateway = "https://ipfs.io/ipfs/",
  education = [],
  experience = [],
  projects = [],
}: ResumeSectionProps) {
  const [downloading, setDownloading] = React.useState(false);
  const [gatewayStatus, setGatewayStatus] = React.useState<GatewayStatus>("checking");

  // Gateway health check
  React.useEffect(() => {
    let active = true;
    const check = async () => {
      try {
        // Use a small request to check reachability (HEAD may be blocked on some gateways; use GET with no-cors fallback)
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4500);
        const res = await fetch(ipfsGateway, { method: "GET", mode: "no-cors", signal: controller.signal }).catch(() => undefined);
        clearTimeout(timeout);
        if (!active) return;
        // no-cors returns opaque but reachable; consider online
        setGatewayStatus(res ? "online" : "degraded");
      } catch {
        if (!active) return;
        setGatewayStatus("offline");
      }
    };
    check();
    const id = setTimeout(check, 100); // slight follow-up to stabilize
    return () => {
      active = false;
      clearTimeout(id);
    };
  }, [ipfsGateway]);

  const handleDownload = async () => {
    if (!resumeCid) {
      toast.error("Resume not available");
      return;
    }
    try {
      setDownloading(true);
      const url = getIpfsUrl(ipfsGateway, resumeCid);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = "Resume.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
      toast.success("Resume downloaded");
    } catch (e) {
      console.error(e);
      toast.error("Could not download resume from IPFS");
    } finally {
      setDownloading(false);
    }
  };

  const copyToClipboard = async (text: string, label?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label ?? "Link"} copied`);
    } catch {
      toast.error("Copy failed");
    }
  };

  const openInNew = (url: string) => {
    try {
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      // ignore
    }
  };

  const StatusPill = () => {
    const map: Record<GatewayStatus, { label: string; color: string }> = {
      checking: { label: "Checking IPFS", color: "bg-muted text-muted-foreground" },
      online: { label: "IPFS Online", color: "bg-[--chart-3]/15 text-[--chart-3]" },
      degraded: { label: "IPFS Limited", color: "bg-[--chart-4]/15 text-[--chart-4]" },
      offline: { label: "IPFS Offline", color: "bg-destructive/20 text-destructive" },
    };
    const s = map[gatewayStatus];
    return (
      <span
        aria-live="polite"
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium",
          s.color
        )}
      >
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            gatewayStatus === "online" && "bg-[--chart-3]",
            gatewayStatus === "degraded" && "bg-[--chart-4]",
            gatewayStatus === "offline" && "bg-destructive",
            gatewayStatus === "checking" && "bg-muted-foreground/50"
          )}
        />
        {s.label}
      </span>
    );
  };

  const renderTimelineItem = (title: string, subtitle: string, dateRange: string, highlights?: string[]) => (
    <li className="relative pl-6">
      <span className="absolute left-0 top-2">
        <Dot />
      </span>
      <div className="min-w-0">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm sm:text-base font-medium break-words">{title}</p>
          <span className="text-xs text-muted-foreground shrink-0">{dateRange}</span>
        </div>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
        {highlights && highlights.length > 0 && (
          <ul className="mt-2 space-y-1">
            {highlights.map((h, i) => (
              <li key={i} className="text-sm text-foreground/90">
                • {h}
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  );

  return (
    <section
      className={cn(
        "w-full max-w-full rounded-xl border bg-card p-5 sm:p-6 md:p-8 shadow-sm",
        className
      )}
      style={style}
      aria-label="Resume section"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">{heading}</h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">{subheading}</p>
          <div className="mt-3">
            <StatusPill />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={handleDownload}
            disabled={!resumeCid || downloading}
            aria-busy={downloading}
            aria-label="Download PDF resume from IPFS"
            className="inline-flex items-center gap-2"
          >
            {downloading ? (
              <>
                <span className="relative inline-flex h-4 w-4">
                  <span className="absolute inline-flex h-4 w-4 rounded-full border-2 border-primary/30 border-t-transparent animate-spin" />
                </span>
                Preparing...
              </>
            ) : (
              <>
                <File className="h-4 w-4" aria-hidden="true" />
                Download PDF
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="rounded-lg border bg-secondary/40 p-4 sm:p-5">
          <SectionTitle icon={GraduationCap} title="Education" />
          <ol className="mt-4 border-l border-border/60 pl-3 space-y-5">
            {education.length === 0 ? (
              <li className="text-sm text-muted-foreground pl-3">No education records provided.</li>
            ) : (
              education.map((e, idx) =>
                <React.Fragment key={`${e.institution}-${idx}`}>
                  {renderTimelineItem(
                    e.institution,
                    e.degree,
                    `${e.start} — ${e.end}`,
                    e.highlights
                  )}
                </React.Fragment>
              )
            )}
          </ol>
        </div>

        <div className="rounded-lg border bg-secondary/40 p-4 sm:p-5">
          <SectionTitle icon={Briefcase} title="Experience" />
          <ol className="mt-4 border-l border-border/60 pl-3 space-y-5">
            {experience.length === 0 ? (
              <li className="text-sm text-muted-foreground pl-3">No experience records provided.</li>
            ) : (
              experience.map((x, idx) =>
                <React.Fragment key={`${x.company}-${idx}`}>
                  {renderTimelineItem(
                    x.company,
                    x.role,
                    `${x.start} — ${x.end}`,
                    x.highlights
                  )}
                </React.Fragment>
              )
            )}
          </ol>
        </div>
      </div>

      <div className="mt-8 rounded-lg border bg-secondary/40 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <SectionTitle icon={FileStack} title="Project Files (IPFS)" />
          <span className="text-xs text-muted-foreground">Shareable links • Copy or open</span>
        </div>

        <div className="mt-4 space-y-4">
          {projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">No project files available.</p>
          ) : (
            projects.map((p, idx) => {
              const files: { label: string; cid: string }[] = [
                ...(p.reportCid ? [{ label: "Report (PDF)", cid: p.reportCid }] : []),
                ...(p.datasetCid ? [{ label: "Dataset", cid: p.datasetCid }] : []),
                ...(p.otherFiles ?? []),
              ];
              return (
                <div
                  key={`${p.title}-${idx}`}
                  className="rounded-lg border bg-card/60 p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <FileCheck2 className="h-4 w-4 text-primary" aria-hidden="true" />
                        <h4 className="text-sm sm:text-base font-semibold truncate">{p.title}</h4>
                      </div>
                      {p.description && (
                        <p className="mt-1 text-sm text-muted-foreground break-words">{p.description}</p>
                      )}
                    </div>
                  </div>

                  {files.length > 0 ? (
                    <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {files.map((f, i) => {
                        const url = getIpfsUrl(ipfsGateway, f.cid);
                        return (
                          <li key={`${f.label}-${i}`} className="flex min-w-0 items-center justify-between gap-3 rounded-md border bg-secondary/50 p-3">
                            <div className="min-w-0">
                              <p className="text-sm font-medium">{f.label}</p>
                              <p className="text-xs text-muted-foreground break-words">{f.cid}</p>
                            </div>
                            <div className="shrink-0 flex items-center gap-2">
                              <Button
                                type="button"
                                variant="secondary"
                                className="h-8 px-2"
                                onClick={() => copyToClipboard(url, f.label)}
                                aria-label={`Copy ${f.label} IPFS link`}
                              >
                                <Copy className="h-4 w-4" aria-hidden="true" />
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                className="h-8 px-2"
                                onClick={() => openInNew(url)}
                                aria-label={`Open ${f.label} in new tab`}
                              >
                                <File className="h-4 w-4" aria-hidden="true" />
                              </Button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">No files listed for this project.</p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="mt-6 text-[11px] text-muted-foreground">
        Note: IPFS availability may vary based on gateway health. If a link fails, try again or use a different gateway.
      </div>
    </section>
  );
}