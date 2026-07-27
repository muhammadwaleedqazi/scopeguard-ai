export type RequirementStatus = "confirmed" | "proposed" | "unclear";
export type RiskLevel = "none" | "low" | "medium" | "high";
export type LocalResultSource = "demo" | "mock" | "webhook";

export interface Requirement {
  id: string;
  text: string;
  status: RequirementStatus;
  evidence?: string;
}

export interface Decision {
  id: string;
  text: string;
  evidence?: string;
}

export interface Deadline {
  id: string;
  task: string;
  date: string;
  evidence?: string;
}

export interface ActionItem {
  id: string;
  task: string;
  owner?: string;
  deadline?: string;
  status: "pending" | "completed";
  evidence?: string;
}

export interface ProjectAnalysis {
  summary: string;
  requirements: Requirement[];
  decisions: Decision[];
  deadlines: Deadline[];
  actionItems: ActionItem[];
  openQuestions: string[];
  clientPreferences: string[];
  people: string[];
  analysedAt: string;
  source: LocalResultSource;
}

export interface ScopeFinding {
  id: string;
  text: string;
  reason: string;
  evidence?: string;
}

export interface ScopeCheck {
  id: string;
  newMessage: string;
  isScopeChange: boolean;
  riskLevel: RiskLevel;
  newRequests: ScopeFinding[];
  changedRequirements: ScopeFinding[];
  conflicts: ScopeFinding[];
  explanation: string;
  possibleImpact: string[];
  suggestedReply: string;
  checkedAt: string;
  source: LocalResultSource;
}

export interface Project {
  id: string;
  name: string;
  clientName: string;
  description: string;
  originalContext: string;
  analysis?: ProjectAnalysis;
  scopeChecks: ScopeCheck[];
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;
}

export type NewProject = Pick<Project, "name" | "clientName" | "description">;
