"use client";

import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
import HeroLanding from "@/components/HeroLanding";
import PortfolioSection from "@/components/PortfolioSection";
import Web3Features from "@/components/Web3Features";
import ResumeSection from "@/components/ResumeSection";
import ContactSection from "@/components/ContactSection";
import AdminPanel, { type Project as AdminProject } from "@/components/AdminPanel";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type Mode = "ai" | "ce";

export default function Page() {
  const [mode, setMode] = useState<Mode>("ai");
  const [showAdmin, setShowAdmin] = useState(false);
  const [displayName, setDisplayName] = useState<string>("ARCHISHMAN DAS");
  const [initialProjects, setInitialProjects] = useState<AdminProject[]>([]);

  const portfolioRef = useRef<HTMLDivElement | null>(null);
  const resumeRef = useRef<HTMLDivElement | null>(null);
  const web3Ref = useRef<HTMLDivElement | null>(null);
  const contactRef = useRef<HTMLDivElement | null>(null);
  const adminRef = useRef<HTMLDivElement | null>(null);

  const scrollTo = useCallback((ref: React.RefObject<HTMLElement | null>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const handleExploreAI = useCallback(() => {
    setMode("ai");
    scrollTo(portfolioRef);
  }, [scrollTo]);

  const handleExploreCE = useCallback(() => {
    setMode("ce");
    scrollTo(portfolioRef);
  }, [scrollTo]);

  const navItems = useMemo(
    () => [
      { label: "Portfolio", action: () => scrollTo(portfolioRef) },
      { label: "Resume", action: () => scrollTo(resumeRef) },
      { label: "Web3", action: () => scrollTo(web3Ref) },
      { label: "Contact", action: () => scrollTo(contactRef) },
    ],
    [scrollTo]
  );

  // Fetch settings (display name) and initial projects
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null;
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    // settings
    fetch("/api/settings", { headers })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.displayName) setDisplayName(data.displayName);
      })
      .catch(() => {});

    // projects
    fetch(`/api/projects?limit=20&offset=0`, { headers })
      .then((r) => (r.ok ? r.json() : []))
      .then((items: any[]) => {
        const mapped: AdminProject[] = (items || []).map((p) => ({
          id: String(p.id),
          title: p.title,
          description: p.description,
          repoUrl: p.repoUrl ?? undefined,
          nftBadgeUrl: p.nftBadgeUrl ?? undefined,
          ipfsAsset: p.ipfs
            ? {
                cid: p.ipfs.cid ?? "",
                url: p.ipfs.url ?? "",
                pinned: Boolean(p.ipfs.pinned),
                name: p.ipfs.name ?? undefined,
                size: p.ipfs.size ?? undefined,
              }
            : undefined,
          createdAt: new Date(p.createdAt ?? Date.now()).toISOString(),
          updatedAt: new Date(p.updatedAt ?? Date.now()).toISOString(),
        }));
        setInitialProjects(mapped);
      })
      .catch(() => {});
  }, []);

  // CRUD handlers for AdminPanel
  const createProject = useCallback(async (
    project: Omit<AdminProject, "id" | "createdAt" | "updatedAt">
  ): Promise<AdminProject> => {
    const token = typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null;
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        title: project.title,
        description: project.description,
        repoUrl: project.repoUrl || null,
        nftBadgeUrl: project.nftBadgeUrl || null,
        ipfsCid: project.ipfsAsset?.cid || null,
        ipfsUrl: project.ipfsAsset?.url || null,
        ipfsPinned: project.ipfsAsset ? !!project.ipfsAsset.pinned : false,
        assetName: project.ipfsAsset?.name || null,
        assetSize: project.ipfsAsset?.size ?? null,
      }),
    });
    if (!res.ok) throw new Error("Create failed");
    const p = await res.json();
    return {
      id: String(p.id),
      title: p.title,
      description: p.description,
      repoUrl: p.repoUrl ?? undefined,
      nftBadgeUrl: p.nftBadgeUrl ?? undefined,
      ipfsAsset: p.ipfs
        ? {
            cid: p.ipfs.cid ?? "",
            url: p.ipfs.url ?? "",
            pinned: Boolean(p.ipfs.pinned),
            name: p.ipfs.name ?? undefined,
            size: p.ipfs.size ?? undefined,
          }
        : undefined,
      createdAt: new Date(p.createdAt).toISOString(),
      updatedAt: new Date(p.updatedAt).toISOString(),
    };
  }, []);

  const updateProject = useCallback(async (project: AdminProject): Promise<AdminProject> => {
    const token = typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null;
    const res = await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        title: project.title,
        description: project.description,
        repoUrl: project.repoUrl ?? null,
        nftBadgeUrl: project.nftBadgeUrl ?? null,
        ipfsCid: project.ipfsAsset?.cid ?? null,
        ipfsUrl: project.ipfsAsset?.url ?? null,
        ipfsPinned: project.ipfsAsset ? !!project.ipfsAsset.pinned : undefined,
        assetName: project.ipfsAsset?.name ?? null,
        assetSize: project.ipfsAsset?.size ?? null,
      }),
    });
    if (!res.ok) throw new Error("Update failed");
    const p = await res.json();
    return {
      id: String(p.id),
      title: p.title,
      description: p.description,
      repoUrl: p.repoUrl ?? undefined,
      nftBadgeUrl: p.nftBadgeUrl ?? undefined,
      ipfsAsset: p.ipfs
        ? {
            cid: p.ipfs.cid ?? "",
            url: p.ipfs.url ?? "",
            pinned: Boolean(p.ipfs.pinned),
            name: p.ipfs.name ?? undefined,
            size: p.ipfs.size ?? undefined,
          }
        : undefined,
      createdAt: new Date(p.createdAt).toISOString(),
      updatedAt: new Date(p.updatedAt).toISOString(),
    };
  }, []);

  const deleteProject = useCallback(async (id: string) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null;
    const res = await fetch(`/api/projects/${id}`, {
      method: "DELETE",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) throw new Error("Delete failed");
  }, []);

  return (
    <main className="min-h-svh w-full bg-background text-foreground">
      <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-[var(--ring)]" />
            <span className="text-sm font-medium tracking-wide">Web3 Portfolio</span>
          </div>
          <nav className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <Button
                key={item.label}
                variant="ghost"
                size="sm"
                className="text-sm"
                onClick={item.action}
              >
                {item.label}
              </Button>
            ))}
            <Button
              variant={showAdmin ? "secondary" : "outline"}
              size="sm"
              onClick={() => {
                setShowAdmin((prev) => !prev);
                setTimeout(() => scrollTo(adminRef), 10);
              }}
              className="ml-2"
            >
              {showAdmin ? "Hide Admin" : "Admin"}
            </Button>
            <Button asChild variant="ghost" size="sm" className="ml-1">
              <Link href="/login">Login</Link>
            </Button>
          </nav>
          <div className="md:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => scrollTo(contactRef)}
              className="text-sm"
            >
              Contact
            </Button>
          </div>
        </div>
      </header>

      <section>
        <HeroLanding
          name={displayName}
          tagline={mode === "ai" ? "AI • Data Science • Web3" : "Civil • Structural • Digital Delivery"}
          defaultMode={mode}
          onModeChange={(m) => setMode(m)}
          onExploreAIMode={handleExploreAI}
          onExploreCEMode={handleExploreCE}
          className="rounded-none"
          splineUrl={process.env.NEXT_PUBLIC_SPLINE_SCENE_URL}
        />
      </section>

      <div className="container mx-auto px-4">
        <div ref={portfolioRef} className="scroll-mt-20 pt-10">
          <PortfolioSection
            key={`portfolio-${mode}`}
            initialMode={mode}
            className="mt-4"
          />
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2" ref={resumeRef}>
            <ResumeSection
              heading="Resume"
              subheading="Education, experience, and on-chain files"
              // Provide your resumeCid to enable IPFS resume download
              resumeCid={undefined}
              ipfsGateway="https://ipfs.io/ipfs/"
              education={[
                {
                  institution: "University of Somewhere",
                  degree: mode === "ai" ? "M.S. in Data Science" : "B.S. in Civil Engineering",
                  start: "2018",
                  end: "2022",
                  highlights: [
                    mode === "ai" ? "Thesis: RAG for domain-specific QA" : "Capstone: Seismic design of mid-rise",
                  ],
                },
              ]}
              experience={[
                {
                  company: mode === "ai" ? "AI Labs" : "InfraBuild",
                  role: mode === "ai" ? "Machine Learning Engineer" : "Structural Engineer",
                  start: "2022",
                  end: "Present",
                  highlights: [
                    mode === "ai"
                      ? "Deployed LLM agents and forecasting pipelines"
                      : "Delivered BIM-integrated steel frame designs",
                  ],
                },
              ]}
              projects={[
                {
                  title: mode === "ai" ? "LLM Research Agent" : "FEA Optimizer",
                  description:
                    mode === "ai"
                      ? "Artifacts and datasets hosted on IPFS."
                      : "Optimization reports pinned to IPFS.",
                },
              ]}
              className="w-full"
            />
          </div>

          <div className="lg:col-span-1" ref={web3Ref}>
            <Web3Features
              className="w-full"
              // Tip addresses optional; provide to enable tipping
              tipAddressEthereum={undefined}
              tipAddressPolygon={undefined}
              defaultTipEth="0.01"
              defaultTipMatic="5"
            />
          </div>
        </div>

        <div className="mt-10" ref={contactRef}>
          <ContactSection
            title="Get in touch"
            subtitle="Have a question, collaboration idea, or just want to say hi?"
            social={{
              ens: "yourname.eth",
              lens: "yourhandle",
              github: "yourgithub",
              linkedin: "https://www.linkedin.com/in/your-profile",
            }}
            className="w-full"
          />
        </div>

        <div className="mt-10" ref={adminRef}>
          {showAdmin && (
            <AdminPanel
              className="w-full"
              initialProjects={initialProjects}
              onCreateProject={createProject}
              onUpdateProject={updateProject}
              onDeleteProject={deleteProject}
            />
          )}
        </div>

        <footer className="mt-12 border-t border-border/60 py-8">
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} {displayName}. All rights reserved.
            </p>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => scrollTo(portfolioRef)}>
                Portfolio
              </Button>
              <Button variant="ghost" size="sm" onClick={() => scrollTo(contactRef)}>
                Contact
              </Button>
              <Button variant="ghost" size="sm" onClick={() => scrollTo(web3Ref)}>
                Web3
              </Button>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}