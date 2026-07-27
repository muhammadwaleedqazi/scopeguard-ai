"use client";

import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore } from "react";
import { makeDemoProject, makeProject, readProjects, writeProjects } from "@/lib/projects";
import type { NewProject, Project } from "@/types/project";

interface ProjectContextValue {
  projects: Project[];
  ready: boolean;
  createProject: (input: NewProject) => Project;
  createDemo: () => Project;
  deleteProject: (id: string) => void;
  updateProject: (
    id: string,
    update: Partial<Project> | ((project: Project) => Project),
  ) => void;
  getProject: (id: string) => Project | undefined;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);
const subscribeToHydration = () => () => undefined;

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(() =>
    typeof window === "undefined" ? [] : readProjects(),
  );
  const ready = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );

  const persist = useCallback((next: Project[]) => {
    setProjects(next);
    writeProjects(next);
  }, []);

  const createProject = useCallback((input: NewProject) => {
    const project = makeProject(input);
    persist([project, ...projects]);
    return project;
  }, [persist, projects]);

  const createDemo = useCallback(() => {
    const existing = projects.find((project) => project.isDemo);
    if (existing) return existing;
    const project = makeDemoProject();
    persist([project, ...projects]);
    return project;
  }, [persist, projects]);

  const deleteProject = useCallback((id: string) => {
    persist(projects.filter((project) => project.id !== id));
  }, [persist, projects]);

  const updateProject = useCallback((
    id: string,
    update: Partial<Project> | ((project: Project) => Project),
  ) => {
    setProjects((current) => {
      const next = current.map((project) => {
        if (project.id !== id) return project;
        const updated =
          typeof update === "function"
            ? update(project)
            : { ...project, ...update };
        return { ...updated, updatedAt: new Date().toISOString() };
      });
      writeProjects(next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({
    projects,
    ready,
    createProject,
    createDemo,
    deleteProject,
    updateProject,
    getProject: (id: string) => projects.find((project) => project.id === id),
  }), [projects, ready, createProject, createDemo, deleteProject, updateProject]);

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProjects() {
  const context = useContext(ProjectContext);
  if (!context) throw new Error("useProjects must be used within ProjectProvider");
  return context;
}
