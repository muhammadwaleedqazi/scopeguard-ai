"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FolderOpen, Plus, Sparkles } from "lucide-react";
import { useProjects } from "./project-provider";
import { ProjectCard } from "./project-card";
import { useToast } from "./toast-provider";

export function ProjectsDashboard() {
  const { projects, ready, createDemo, deleteProject } = useProjects();
  const { addToast } = useToast();
  const router = useRouter();

  if (!ready) {
    return <div className="loading-state" aria-live="polite"><span /><p>Loading your projects…</p></div>;
  }

  return (
    <div className="shell page-space">
      <div className="page-heading">
        <div><span className="eyebrow"><span /> Project records</span><h1>Your projects</h1><p>Keep each client engagement clear, current, and easy to return to.</p></div>
        <Link className="button button-primary" href="/projects/new"><Plus size={16} aria-hidden="true" /> Create project</Link>
      </div>
      {projects.length === 0 ? (
        <section className="empty-state">
          <span className="empty-mark" aria-hidden="true"><FolderOpen size={24} /></span>
          <span className="micro-label">Your project desk is clear</span>
          <h2>Create a reliable record<br />from the very first conversation.</h2>
          <p>Add a client project to start organizing what was agreed. Nothing leaves this device in the current MVP.</p>
          <div className="empty-actions">
            <Link className="button button-primary" href="/projects/new"><Plus size={16} aria-hidden="true" /> Create your first project</Link>
            <button className="button button-secondary" onClick={() => router.push(`/projects/${createDemo().id}`)}><Sparkles size={16} aria-hidden="true" /> Explore a demo project</button>
          </div>
          <small>Demo content is fictional and clearly labeled.</small>
        </section>
      ) : (
        <>
          <div className="dashboard-toolbar"><p>{projects.length} {projects.length === 1 ? "project" : "projects"} stored on this device</p><button className="text-button" type="button" onClick={() => router.push(`/projects/${createDemo().id}`)}>Add demo project</button></div>
          <div className="project-grid">{projects.map((project) => <ProjectCard key={project.id} project={project} onDelete={() => {
            deleteProject(project.id);
            addToast({
              title: "Project deleted",
              message: `${project.name} was removed from this device.`,
              tone: "success",
            });
          }} />)}</div>
        </>
      )}
    </div>
  );
}
