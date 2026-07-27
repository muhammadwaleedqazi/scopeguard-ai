"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, FolderPlus } from "lucide-react";
import { useProjects } from "./project-provider";
import { useToast } from "./toast-provider";

export function CreateProjectForm() {
  const { createProject } = useProjects();
  const { addToast } = useToast();
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const input = {
      name: String(data.get("name") ?? "").trim(),
      clientName: String(data.get("clientName") ?? "").trim(),
      description: String(data.get("description") ?? "").trim(),
    };
    const nextErrors: Record<string, string> = {};
    if (!input.name) nextErrors.name = "Enter a project name.";
    if (!input.clientName) nextErrors.clientName = "Enter the client name.";
    if (!input.description) nextErrors.description = "Add a short project description.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    const project = createProject(input);
    addToast({
      title: "Project saved",
      message: "Your new project record is ready.",
      tone: "success",
    });
    router.push(`/projects/${project.id}`);
  }

  return (
    <form className="create-form" onSubmit={handleSubmit} noValidate>
      <div className="form-intro"><span className="form-intro-icon" aria-hidden="true"><FolderPlus size={20} /></span><span className="micro-label">Project details</span><h2>Start with the essentials.</h2><p>You can add the original brief and client messages inside the project workspace.</p></div>
      <div className="field">
        <label htmlFor="name">Project name</label>
        <input id="name" name="name" placeholder="e.g. Spring campaign website" aria-describedby={errors.name ? "name-error" : undefined} aria-invalid={Boolean(errors.name)} />
        {errors.name && <span className="field-error" id="name-error">{errors.name}</span>}
      </div>
      <div className="field">
        <label htmlFor="clientName">Client name</label>
        <input id="clientName" name="clientName" placeholder="e.g. Northstar Studio" aria-describedby={errors.clientName ? "client-error" : undefined} aria-invalid={Boolean(errors.clientName)} />
        {errors.clientName && <span className="field-error" id="client-error">{errors.clientName}</span>}
      </div>
      <div className="field">
        <div className="label-row"><label htmlFor="description">Short description</label><span>Keep it concise</span></div>
        <textarea id="description" name="description" rows={4} placeholder="What are you helping the client deliver?" aria-describedby={errors.description ? "description-error" : "description-hint"} aria-invalid={Boolean(errors.description)} />
        {errors.description ? <span className="field-error" id="description-error">{errors.description}</span> : <span className="field-hint" id="description-hint">A sentence or two is enough for now.</span>}
      </div>
      <div className="form-actions"><Link className="button button-secondary" href="/projects">Cancel</Link><button className="button button-primary" type="submit">Create project <ArrowRight size={16} aria-hidden="true" /></button></div>
    </form>
  );
}
