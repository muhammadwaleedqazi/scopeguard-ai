import type {
  ActionItem,
  Deadline,
  Decision,
  Project,
  ProjectAnalysis,
  Requirement,
  RequirementStatus,
  RiskLevel,
  ScopeCheck,
  ScopeFinding,
} from "@/types/project";

type JsonRecord = Record<string, unknown>;

const ANALYSE_WEBHOOK_URL =
  process.env.NEXT_PUBLIC_N8N_ANALYSE_WEBHOOK_URL;
const SCOPE_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_SCOPE_WEBHOOK_URL;
const REQUEST_TIMEOUT_MS = 90_000;

class WebhookError extends Error {}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new WebhookError(`The service response is missing ${field}.`);
  }
  return value;
}

function asBoolean(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") {
    throw new WebhookError(`The service response is missing ${field}.`);
  }
  return value;
}

function asArray(value: unknown, field: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new WebhookError(`The service response is missing ${field}.`);
  }
  return value;
}

function asStringArray(value: unknown, field: string): string[] {
  return asArray(value, field).map((item, index) =>
    asString(item, `${field}[${index}]`),
  );
}

function safeFailureMessage(
  body: unknown,
  fallbackMessage: string,
): string {
  if (!isRecord(body) || body.success !== false) return fallbackMessage;

  const error =
    typeof body.error === "string" && body.error.trim()
      ? body.error.trim()
      : fallbackMessage;
  const details = Array.isArray(body.details)
    ? body.details.filter(
        (detail): detail is string =>
          typeof detail === "string" && Boolean(detail.trim()),
      )
    : [];

  return details.length ? `${error}: ${details.join(" ")}` : error;
}

async function requestWebhook(
  configuredUrl: string | undefined,
  environmentVariable: string,
  payload: JsonRecord,
  failureMessage: string,
): Promise<JsonRecord> {
  const url = configuredUrl?.trim();
  if (!url) {
    throw new WebhookError(
      `This service is not configured. Add ${environmentVariable} to .env.local.`,
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new WebhookError(failureMessage);
    }

    if (!response.ok) {
      throw new WebhookError(safeFailureMessage(body, failureMessage));
    }
    if (!isRecord(body) || body.success !== true) {
      throw new WebhookError(safeFailureMessage(body, failureMessage));
    }

    return body;
  } catch (error) {
    if (error instanceof WebhookError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new WebhookError(
        "The service took too long to respond. Please try again.",
      );
    }
    throw new WebhookError(
      "The service could not be reached. Check your connection and try again.",
    );
  } finally {
    clearTimeout(timeout);
  }
}

function parseRequirement(value: unknown, index: number): Requirement {
  if (!isRecord(value)) {
    throw new WebhookError(`Invalid requirement at position ${index + 1}.`);
  }

  const status = asString(
    value.status,
    `analysis.requirements[${index}].status`,
  );
  if (!["confirmed", "proposed", "unclear"].includes(status)) {
    throw new WebhookError(
      `Invalid requirement status at position ${index + 1}.`,
    );
  }

  return {
    id: asString(value.id, `analysis.requirements[${index}].id`),
    text: asString(value.text, `analysis.requirements[${index}].text`),
    status: status as RequirementStatus,
    evidence: asString(
      value.evidence,
      `analysis.requirements[${index}].evidence`,
    ),
  };
}

function parseDecision(value: unknown, index: number): Decision {
  if (!isRecord(value)) {
    throw new WebhookError(`Invalid decision at position ${index + 1}.`);
  }
  return {
    id: asString(value.id, `analysis.decisions[${index}].id`),
    text: asString(value.text, `analysis.decisions[${index}].text`),
    evidence: asString(
      value.evidence,
      `analysis.decisions[${index}].evidence`,
    ),
  };
}

function parseDeadline(value: unknown, index: number): Deadline {
  if (!isRecord(value)) {
    throw new WebhookError(`Invalid deadline at position ${index + 1}.`);
  }
  return {
    id: asString(value.id, `analysis.deadlines[${index}].id`),
    task: asString(value.task, `analysis.deadlines[${index}].task`),
    date: asString(value.date, `analysis.deadlines[${index}].date`),
    evidence: asString(
      value.evidence,
      `analysis.deadlines[${index}].evidence`,
    ),
  };
}

function parseActionItem(value: unknown, index: number): ActionItem {
  if (!isRecord(value)) {
    throw new WebhookError(`Invalid action item at position ${index + 1}.`);
  }
  const status = asString(
    value.status,
    `analysis.actionItems[${index}].status`,
  );
  if (status !== "pending" && status !== "completed") {
    throw new WebhookError(
      `Invalid action item status at position ${index + 1}.`,
    );
  }

  return {
    id: asString(value.id, `analysis.actionItems[${index}].id`),
    task: asString(value.task, `analysis.actionItems[${index}].task`),
    owner: asString(value.owner, `analysis.actionItems[${index}].owner`),
    deadline: asString(
      value.deadline,
      `analysis.actionItems[${index}].deadline`,
    ),
    status,
  };
}

function parseAnalysis(value: unknown): ProjectAnalysis {
  if (!isRecord(value)) {
    throw new WebhookError("The service response is missing analysis.");
  }

  return {
    summary: asString(value.summary, "analysis.summary"),
    requirements: asArray(value.requirements, "analysis.requirements").map(
      parseRequirement,
    ),
    decisions: asArray(value.decisions, "analysis.decisions").map(
      parseDecision,
    ),
    deadlines: asArray(value.deadlines, "analysis.deadlines").map(
      parseDeadline,
    ),
    actionItems: asArray(value.actionItems, "analysis.actionItems").map(
      parseActionItem,
    ),
    openQuestions: asStringArray(
      value.openQuestions,
      "analysis.openQuestions",
    ),
    clientPreferences: asStringArray(
      value.clientPreferences,
      "analysis.clientPreferences",
    ),
    people: asStringArray(value.people, "analysis.people"),
    analysedAt: asString(value.analysedAt, "analysis.analysedAt"),
    source: "webhook",
  };
}

function parseScopeFinding(value: unknown, index: number): ScopeFinding {
  if (!isRecord(value)) {
    throw new WebhookError(`Invalid scope finding at position ${index + 1}.`);
  }
  return {
    id: asString(value.id, `scopeCheck.findings[${index}].id`),
    text: asString(value.text, `scopeCheck.findings[${index}].text`),
    reason: asString(value.reason, `scopeCheck.findings[${index}].reason`),
    evidence:
      typeof value.evidence === "string" ? value.evidence : undefined,
  };
}

function parseFindingArray(value: unknown, field: string): ScopeFinding[] {
  return asArray(value, `scopeCheck.${field}`).map(parseScopeFinding);
}

function parseScopeCheck(value: unknown, newMessage: string): ScopeCheck {
  if (!isRecord(value)) {
    throw new WebhookError("The service response is missing scopeCheck.");
  }

  const riskLevel = asString(value.riskLevel, "scopeCheck.riskLevel");
  if (!["none", "low", "medium", "high"].includes(riskLevel)) {
    throw new WebhookError("The service returned an invalid risk level.");
  }

  return {
    id: crypto.randomUUID(),
    newMessage,
    isScopeChange: asBoolean(
      value.isScopeChange,
      "scopeCheck.isScopeChange",
    ),
    riskLevel: riskLevel as RiskLevel,
    newRequests: parseFindingArray(value.newRequests, "newRequests"),
    changedRequirements: parseFindingArray(
      value.changedRequirements,
      "changedRequirements",
    ),
    conflicts: parseFindingArray(value.conflicts, "conflicts"),
    explanation: asString(value.explanation, "scopeCheck.explanation"),
    possibleImpact: asStringArray(value.impact, "scopeCheck.impact"),
    suggestedReply: asString(
      value.suggestedReply,
      "scopeCheck.suggestedReply",
    ),
    checkedAt: asString(value.checkedAt, "scopeCheck.checkedAt"),
    source: "webhook",
  };
}

function assertMatchingProject(body: JsonRecord, projectId: string) {
  if (body.projectId !== projectId) {
    throw new WebhookError(
      "The service response did not match the active project.",
    );
  }
}

export async function analyseProjectWithWebhook(
  project: Project,
): Promise<ProjectAnalysis> {
  const body = await requestWebhook(
    ANALYSE_WEBHOOK_URL,
    "NEXT_PUBLIC_N8N_ANALYSE_WEBHOOK_URL",
    {
      projectId: project.id,
      projectName: project.name,
      clientName: project.clientName,
      description: project.description,
      originalContext: project.originalContext,
    },
    "Project analysis could not be completed. Please try again.",
  );

  assertMatchingProject(body, project.id);
  const analysis = parseAnalysis(body.analysis);
  if (!project.analysis) return analysis;

  const completedActions = new Set(
    project.analysis.actionItems
      .filter((action) => action.status === "completed")
      .flatMap((action) => [action.id, action.task.trim().toLowerCase()]),
  );

  return {
    ...analysis,
    actionItems: analysis.actionItems.map((action) => ({
      ...action,
      status:
        completedActions.has(action.id) ||
        completedActions.has(action.task.trim().toLowerCase())
          ? "completed"
          : action.status,
    })),
  };
}

export async function checkScopeWithWebhook(
  project: Project,
  newMessage: string,
): Promise<ScopeCheck> {
  if (!project.analysis) {
    throw new WebhookError(
      "Analyse the project before checking a new request.",
    );
  }

  const analysis = project.analysis;
  const body = await requestWebhook(
    SCOPE_WEBHOOK_URL,
    "NEXT_PUBLIC_N8N_SCOPE_WEBHOOK_URL",
    {
      projectId: project.id,
      projectName: project.name,
      existingAnalysis: {
        summary: analysis.summary,
        requirements: analysis.requirements,
        decisions: analysis.decisions,
        deadlines: analysis.deadlines,
        actionItems: analysis.actionItems,
        openQuestions: analysis.openQuestions,
        clientPreferences: analysis.clientPreferences,
        people: analysis.people,
      },
      newMessage,
    },
    "The scope check could not be completed. Please try again.",
  );

  assertMatchingProject(body, project.id);
  return parseScopeCheck(body.scopeCheck, newMessage);
}

export function getWebhookErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string {
  return error instanceof WebhookError ? error.message : fallbackMessage;
}
