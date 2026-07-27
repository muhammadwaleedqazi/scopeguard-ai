import type { Metadata } from "next";
import { ProjectWorkspace } from "@/components/project-workspace";

export const metadata: Metadata = { title: "Project workspace" };

export default function ProjectPage() {
  return <ProjectWorkspace />;
}
