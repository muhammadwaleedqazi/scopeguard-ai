"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, FolderKanban, Trash2 } from "lucide-react";
import type { Project } from "@/types/project";
import { ConfirmDialog } from "./confirm-dialog";

export function ProjectCard({ project, onDelete }: { project: Project; onDelete: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const updated = new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(new Date(project.updatedAt));
  return (
    <>
      <article className="project-card">
        <div className="project-card-top">
          <span className="project-initial" aria-hidden="true"><FolderKanban size={19} /><b>{project.name.charAt(0).toUpperCase()}</b></span>
          {project.isDemo && <span className="status status-demo">Demo project</span>}
        </div>
        <div>
          <p className="client-name">{project.clientName}</p>
          <h2><Link href={`/projects/${project.id}`}>{project.name}</Link></h2>
          <p className="project-description">{project.description}</p>
        </div>
        <div className="project-meta"><span>Updated {updated}</span><span>{project.analysis ? "Record available" : "Setup needed"}</span></div>
        <div className="project-actions">
          <Link className="button button-secondary" href={`/projects/${project.id}`}>Open project <ArrowUpRight size={15} aria-hidden="true" /></Link>
          <button className="icon-button" aria-label={`Delete ${project.name}`} onClick={() => setConfirming(true)}><Trash2 size={14} aria-hidden="true" /> Delete</button>
        </div>
      </article>
      <ConfirmDialog open={confirming} projectName={project.name} onCancel={() => setConfirming(false)} onConfirm={() => { onDelete(); setConfirming(false); }} />
    </>
  );
}
