import type { Metadata } from "next";
import { CreateProjectForm } from "@/components/create-project-form";

export const metadata: Metadata = { title: "Create project" };

export default function NewProjectPage() {
  return (
    <div className="shell form-page">
      <div className="form-page-copy">
        <span className="eyebrow"><span /> New project record</span>
        <h1>Begin with clarity.</h1>
        <p>Create a dedicated place for the agreement, the decisions, and everything that changes along the way.</p>
        <div className="privacy-note"><span>✓</span><div><strong>Private to this device</strong><p>Your projects use local browser storage in this MVP.</p></div></div>
      </div>
      <CreateProjectForm />
    </div>
  );
}
