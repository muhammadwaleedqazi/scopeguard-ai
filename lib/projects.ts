import type { NewProject, Project } from "@/types/project";
import { createDemoAnalysis } from "./mock-data";

export const STORAGE_KEY = "scopeguard.projects.v1";

export function makeProject(input: NewProject): Project {
  const now = new Date().toISOString();
  return {
    ...input,
    id: crypto.randomUUID(),
    originalContext: "",
    scopeChecks: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function makeDemoProject(): Project {
  const project = makeProject({
    name: "ABC Clothing E-commerce Website",
    clientName: "ABC Clothing",
    description: "A responsive online shop for the client’s clothing catalogue.",
  });
  return {
    ...project,
    isDemo: true,
    originalContext:
      "Build a responsive online shop with a product catalogue, shopping cart and contact form. Delivery is required within three weeks. The client approved the homepage layout. Payment gateway work was postponed to phase two.",
    analysis: createDemoAnalysis(project.updatedAt),
  };
}

export function readProjects(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as Project[]).map((project) =>
      project.isDemo
        ? {
            ...project,
            analysis: createDemoAnalysis(
              project.analysis?.analysedAt ?? project.updatedAt,
              project.analysis,
            ),
          }
        : project,
    );
  } catch {
    return [];
  }
}

export function writeProjects(projects: Project[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}
