"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { DEMO_MESSAGE } from "@/lib/mock-data";
import {
  analyseProjectWithWebhook,
  checkScopeWithWebhook,
  getWebhookErrorMessage,
} from "@/lib/webhooks";
import type {
  Decision,
  Project,
  ProjectAnalysis,
  Requirement,
  RiskLevel,
  ScopeCheck,
  ScopeFinding,
} from "@/types/project";
import { useProjects } from "./project-provider";
import { useToast } from "./toast-provider";

const dateFormatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function StatusBadge({ status }: { status: Requirement["status"] }) {
  return <span className={`status status-${status}`}>{status}</span>;
}

function Evidence({ children }: { children?: string }) {
  if (!children) return null;
  return (
    <details className="evidence">
      <summary>View source evidence</summary>
      <p>{children}</p>
    </details>
  );
}

function RequirementList({
  requirements,
  emptyCopy,
}: {
  requirements: Requirement[];
  emptyCopy: string;
}) {
  if (!requirements.length) return <p className="section-empty">{emptyCopy}</p>;
  return (
    <ul className="record-items">
      {requirements.map((requirement) => (
        <li key={requirement.id}>
          <div className="record-item-heading">
            <span>{requirement.text}</span>
            <StatusBadge status={requirement.status} />
          </div>
          <Evidence>{requirement.evidence}</Evidence>
        </li>
      ))}
    </ul>
  );
}

function DecisionList({
  decisions,
  emptyCopy = "No decisions have been recorded.",
}: {
  decisions: Decision[];
  emptyCopy?: string;
}) {
  if (!decisions.length) {
    return <p className="section-empty">{emptyCopy}</p>;
  }
  return (
    <ul className="record-items">
      {decisions.map((decision) => (
        <li key={decision.id}>
          <div className="record-item-heading">
            <span>{decision.text}</span>
            <span className="status status-recorded">Recorded</span>
          </div>
          <Evidence>{decision.evidence}</Evidence>
        </li>
      ))}
    </ul>
  );
}

function LoadingPanel({
  kind,
  compact = false,
}: {
  kind: "analysis" | "scope";
  compact?: boolean;
}) {
  const steps =
    kind === "analysis"
      ? [
          "Reading project context",
          "Extracting requirements",
          "Organising decisions and next steps",
        ]
      : [
          "Comparing against confirmed scope",
          "Assessing delivery risk",
          "Preparing a professional reply",
        ];

  return (
    <div
      className={`loading-panel${compact ? " loading-panel-compact" : ""}`}
      aria-live="polite"
      aria-busy="true"
    >
      <span className="loading-orbit" aria-hidden="true"><i /></span>
      <div>
        <span className="micro-label">
          {kind === "analysis" ? "Analysing agreement" : "Reviewing request"}
        </span>
        <strong>
          {kind === "analysis"
            ? "Building the project record"
            : "Checking for a scope change"}
        </strong>
        <ul>
          {steps.map((step, index) => (
            <li key={step} style={{ "--step-delay": `${index * 180}ms` } as React.CSSProperties}>
              <span aria-hidden="true" />
              {step}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function matchesSearch(
  query: string,
  values: Array<string | undefined>,
): boolean {
  if (!query) return true;
  return values.some((value) => value?.toLowerCase().includes(query));
}

function ProjectActivityTimeline({ project }: { project: Project }) {
  const events = [
    {
      id: `created-${project.id}`,
      label: "Project created",
      timestamp: project.createdAt,
    },
    ...(project.analysis
      ? [
          {
            id: `analysis-${project.analysis.analysedAt}`,
            label: "Project analysis completed",
            timestamp: project.analysis.analysedAt,
          },
        ]
      : []),
    ...project.scopeChecks.map((scopeCheck) => ({
      id: `scope-${scopeCheck.id}`,
      label: "Scope check completed",
      timestamp: scopeCheck.checkedAt,
    })),
  ]
    .filter((event) => !Number.isNaN(new Date(event.timestamp).getTime()))
    .sort(
      (first, second) =>
        new Date(second.timestamp).getTime() -
        new Date(first.timestamp).getTime(),
    );

  if (events.length < 2) return null;

  return (
    <section className="activity-panel" aria-labelledby="activity-title">
      <div>
        <span className="micro-label">Project activity</span>
        <h2 id="activity-title">Recent record</h2>
      </div>
      <ol>
        {events.slice(0, 5).map((event) => (
          <li key={event.id}>
            <span aria-hidden="true" />
            <div>
              <strong>{event.label}</strong>
              <time dateTime={event.timestamp}>
                {dateFormatter.format(new Date(event.timestamp))}
              </time>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function SimpleList({
  items,
  emptyCopy,
}: {
  items: string[];
  emptyCopy: string;
}) {
  if (!items.length) return <p className="section-empty">{emptyCopy}</p>;
  return (
    <ul className="simple-list">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function AnalysisPanel({
  analysis,
  loading,
  canAnalyse,
  error,
  summaryCopied,
  onAnalyse,
  onCopySummary,
  onToggleAction,
}: {
  analysis?: ProjectAnalysis;
  loading: boolean;
  canAnalyse: boolean;
  error: string;
  summaryCopied: boolean;
  onAnalyse: () => void;
  onCopySummary: () => void;
  onToggleAction: (id: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");

  if (loading) {
    return (
      <section className="analysis-shell">
        <LoadingPanel kind="analysis" />
      </section>
    );
  }

  if (!analysis) {
    return (
      <section className="analysis-empty">
        <span className="analysis-empty-mark">01</span>
        <div>
          <span className="micro-label">Project analysis</span>
          <h2>Turn the brief into a working project record.</h2>
          <p>Once the original context is saved, organise it into requirements, decisions, deadlines, and follow-up items.</p>
          {error && <p className="form-alert" role="alert">{error}</p>}
          <button className="button button-primary" type="button" onClick={onAnalyse} disabled={!canAnalyse}>
            Analyse Project <span>→</span>
          </button>
          {!canAnalyse && <small>Save the original client context first.</small>}
        </div>
      </section>
    );
  }

  const query = searchQuery.trim().toLowerCase();
  const confirmed = analysis.requirements.filter(
    (requirement) =>
      requirement.status === "confirmed" &&
      matchesSearch(query, [
        requirement.text,
        requirement.evidence,
        requirement.status,
      ]),
  );
  const needsAttention = analysis.requirements.filter(
    (requirement) =>
      requirement.status !== "confirmed" &&
      matchesSearch(query, [
        requirement.text,
        requirement.evidence,
        requirement.status,
      ]),
  );
  const decisions = analysis.decisions.filter((decision) =>
    matchesSearch(query, [decision.text, decision.evidence]),
  );
  const deadlines = analysis.deadlines.filter((deadline) =>
    matchesSearch(query, [deadline.task, deadline.date, deadline.evidence]),
  );
  const actionItems = analysis.actionItems.filter((action) =>
    matchesSearch(query, [
      action.task,
      action.owner,
      action.deadline,
      action.evidence,
      action.status,
    ]),
  );
  const searchResultCount =
    confirmed.length +
    needsAttention.length +
    decisions.length +
    deadlines.length +
    actionItems.length;

  return (
    <section className="analysis-shell">
      <div className="analysis-heading">
        <div>
          <span className="micro-label">Structured project record</span>
          <h2>Project analysis</h2>
          <p>Last analysed {dateFormatter.format(new Date(analysis.analysedAt))}</p>
          {error && <p className="form-alert" role="alert">{error}</p>}
        </div>
        <button className="button button-secondary button-compact" type="button" onClick={onAnalyse}>Analyse again</button>
      </div>

      <article className="summary-panel">
        <div className="summary-panel-heading">
          <span className="section-kicker">Project summary</span>
          <button
            className="copy-button copy-button-dark"
            type="button"
            aria-label="Copy project summary"
            onClick={onCopySummary}
          >
            {summaryCopied ? "Copied" : "Copy summary"}
          </button>
        </div>
        <p>{analysis.summary}</p>
      </article>

      <div className="analysis-toolbar" role="search">
        <label htmlFor="analysis-search">Filter analysis</label>
        <div className="search-control">
          <span aria-hidden="true">⌕</span>
          <input
            id="analysis-search"
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search requirements, decisions, deadlines, or actions"
          />
          {searchQuery && (
            <button
              type="button"
              aria-label="Clear analysis search"
              onClick={() => setSearchQuery("")}
            >
              Clear
            </button>
          )}
        </div>
        <p aria-live="polite">
          {query
            ? `${searchResultCount} ${searchResultCount === 1 ? "result" : "results"}`
            : "Search the structured project record"}
        </p>
      </div>

      {query && searchResultCount === 0 && (
        <div className="search-empty" role="status">
          <span aria-hidden="true">0</span>
          <div>
            <strong>No requirements, decisions, deadlines, or actions match “{searchQuery.trim()}”.</strong>
            <p>Try a broader term or clear the filter to view the full record.</p>
          </div>
        </div>
      )}

      <div className="analysis-grid">
        <article className="analysis-card analysis-card-wide">
          <div className="analysis-card-title"><span>01</span><h3>Confirmed requirements</h3><b>{confirmed.length}</b></div>
          <RequirementList requirements={confirmed} emptyCopy={query ? "No confirmed requirements match this search." : "No confirmed requirements were identified."} />
        </article>
        <article className="analysis-card analysis-card-wide">
          <div className="analysis-card-title"><span>02</span><h3>Proposed or unclear</h3><b>{needsAttention.length}</b></div>
          <RequirementList requirements={needsAttention} emptyCopy={query ? "No proposed or unclear requirements match this search." : "No proposed or unclear requirements were identified."} />
        </article>
        <article className="analysis-card">
          <div className="analysis-card-title"><span>03</span><h3>Decisions</h3><b>{decisions.length}</b></div>
          <DecisionList decisions={decisions} emptyCopy={query ? "No decisions match this search." : undefined} />
        </article>
        <article className="analysis-card">
          <div className="analysis-card-title"><span>04</span><h3>Deadlines</h3><b>{deadlines.length}</b></div>
          {deadlines.length ? (
            <ul className="record-items">
              {deadlines.map((deadline) => (
                <li key={deadline.id}>
                  <span className="item-primary">{deadline.task}</span>
                  <span className="item-meta">{deadline.date}</span>
                  <Evidence>{deadline.evidence}</Evidence>
                </li>
              ))}
            </ul>
          ) : <p className="section-empty">{query ? "No deadlines match this search." : "No deadlines were identified."}</p>}
        </article>
        <article className="analysis-card analysis-card-wide">
          <div className="analysis-card-title"><span>05</span><h3>Action items</h3><b>{actionItems.length}</b></div>
          {actionItems.length ? (
            <ul className="action-list">
              {actionItems.map((action) => (
                <li key={action.id}>
                  <label>
                    <input type="checkbox" checked={action.status === "completed"} onChange={() => onToggleAction(action.id)} />
                    <span>
                      <strong className={action.status === "completed" ? "completed" : ""}>{action.task}</strong>
                      <small>{[action.owner, action.deadline].filter(Boolean).join(" · ")}</small>
                    </span>
                  </label>
                  <Evidence>{action.evidence}</Evidence>
                </li>
              ))}
            </ul>
          ) : <p className="section-empty">{query ? "No action items match this search." : "No action items were identified."}</p>}
        </article>
        <article className="analysis-card">
          <div className="analysis-card-title"><span>06</span><h3>Open questions</h3><b>{analysis.openQuestions.length}</b></div>
          <SimpleList items={analysis.openQuestions} emptyCopy="No open questions were identified." />
        </article>
        <article className="analysis-card">
          <div className="analysis-card-title"><span>07</span><h3>Client preferences</h3><b>{analysis.clientPreferences.length}</b></div>
          <SimpleList items={analysis.clientPreferences} emptyCopy="No client preferences were identified." />
        </article>
        <article className="analysis-card">
          <div className="analysis-card-title"><span>08</span><h3>People mentioned</h3><b>{analysis.people.length}</b></div>
          <SimpleList items={analysis.people} emptyCopy="No people were identified." />
        </article>
      </div>
    </section>
  );
}

function FindingGroup({
  title,
  items,
  emptyCopy,
}: {
  title: string;
  items: ScopeFinding[];
  emptyCopy: string;
}) {
  return (
    <section className="finding-group">
      <div className="finding-heading"><h4>{title}</h4><span>{items.length}</span></div>
      {items.length ? (
        <ul>
          {items.map((item) => (
            <li key={item.id}>
              <strong>{item.text}</strong>
              <p>{item.reason}</p>
              <Evidence>{item.evidence}</Evidence>
            </li>
          ))}
        </ul>
      ) : <p className="section-empty">{emptyCopy}</p>}
    </section>
  );
}

function RiskBadge({ risk }: { risk: RiskLevel }) {
  return <span className={`risk-badge risk-${risk}`}><i /> {risk} risk</span>;
}

function ScopeResult({
  result,
  saved,
  copyFeedback,
  explanationCopied,
  replyCopied,
  onCopyExplanation,
  onCopyReply,
  onSave,
}: {
  result: ScopeCheck;
  saved: boolean;
  copyFeedback: string;
  explanationCopied: boolean;
  replyCopied: boolean;
  onCopyExplanation: () => void;
  onCopyReply: () => void;
  onSave: () => void;
}) {
  return (
    <section className={`scope-result scope-result-${result.riskLevel}`} aria-live="polite">
      <div className="scope-result-heading">
        <div className="scope-result-copy">
          <span className="micro-label">Scope review</span>
          <h2>{result.isScopeChange ? "Possible scope change detected" : "No material scope change detected"}</h2>
          <p>{result.explanation}</p>
          <button
            className="copy-button"
            type="button"
            aria-label="Copy scope review explanation"
            onClick={onCopyExplanation}
          >
            {explanationCopied ? "Copied" : "Copy explanation"}
          </button>
        </div>
        <RiskBadge risk={result.riskLevel} />
      </div>

      <div className="finding-grid">
        <FindingGroup title="New requests" items={result.newRequests} emptyCopy="No new requests identified." />
        <FindingGroup title="Changed requirements" items={result.changedRequirements} emptyCopy="No changed requirements identified." />
        <FindingGroup title="Conflicts" items={result.conflicts} emptyCopy="No conflicts identified." />
      </div>

      <section className="impact-panel">
        <span className="section-kicker">Possible project impact</span>
        <ul>{result.possibleImpact.map((impact) => <li key={impact}>{impact}</li>)}</ul>
      </section>

      <section className="reply-panel">
        <div className="reply-heading"><div><span className="section-kicker">Suggested professional reply</span><h3>Respond clearly, without escalating tension.</h3></div><button className="button button-secondary button-compact" type="button" onClick={onCopyReply}>{replyCopied ? "Copied" : "Copy Reply"}</button></div>
        <blockquote>{result.suggestedReply}</blockquote>
        {copyFeedback && <p className="success-message" role="status">{copyFeedback}</p>}
      </section>

      <div className="result-actions">
        <span>{saved ? "This scope check is saved in the project record." : "Review the result before saving it to the project."}</span>
        <button className="button button-primary" type="button" onClick={onSave} disabled={saved}>{saved ? "Scope Check Saved" : "Save Scope Check"}</button>
      </div>
    </section>
  );
}

export function ProjectWorkspace() {
  const params = useParams<{ id: string }>();
  const { getProject, ready, updateProject } = useProjects();
  const { addToast } = useToast();
  const project = getProject(params.id);
  const [contextDraft, setContextDraft] = useState(
    () => project?.originalContext ?? "",
  );
  const [contextFeedback, setContextFeedback] = useState("");
  const [analysisError, setAnalysisError] = useState("");
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [messageDraft, setMessageDraft] = useState(
    () =>
      project?.scopeChecks[0]?.newMessage ??
      (project?.isDemo ? DEMO_MESSAGE : ""),
  );
  const [scopeError, setScopeError] = useState("");
  const [scopeLoading, setScopeLoading] = useState(false);
  const [scopeResult, setScopeResult] = useState<ScopeCheck | null>(
    () => project?.scopeChecks[0] ?? null,
  );
  const [scopeSaved, setScopeSaved] = useState(
    () => Boolean(project?.scopeChecks[0]),
  );
  const [copyFeedback, setCopyFeedback] = useState("");
  const [copiedTarget, setCopiedTarget] = useState<
    "summary" | "explanation" | "reply" | null
  >(null);

  if (!ready) {
    return <div className="loading-state" aria-live="polite"><span /><p>Opening project…</p></div>;
  }

  if (!project) {
    return (
      <div className="shell missing-state">
        <span className="empty-mark">?</span>
        <h1>Project not found</h1>
        <p>It may have been removed from this device.</p>
        <Link className="button button-primary" href="/projects">Return to projects</Link>
      </div>
    );
  }

  const activeProject = project;
  const confirmedCount =
    project.analysis?.requirements.filter(
      (requirement) => requirement.status === "confirmed",
    ).length ?? 0;
  const latestRisk = project.scopeChecks[0]?.riskLevel ?? "none";

  function saveContext() {
    const context = contextDraft.trim();
    if (!context) {
      setContextFeedback("Add the original brief or client messages before saving.");
      return;
    }
    updateProject(activeProject.id, { originalContext: context });
    setContextDraft(context);
    setContextFeedback("Context saved to this project.");
    addToast({
      title: "Project saved",
      message: "The original client context is now part of this record.",
      tone: "success",
    });
  }

  async function analyseProject() {
    if (!activeProject.originalContext) {
      setAnalysisError("Save the original client context before analysing the project.");
      return;
    }
    setAnalysisError("");
    setAnalysisLoading(true);
    try {
      const analysis = await analyseProjectWithWebhook(activeProject);
      updateProject(activeProject.id, {
        analysis,
      });
      addToast({
        title: "Analysis completed",
        message: "The structured project record is ready.",
        tone: "success",
      });
    } catch (error) {
      const message = getWebhookErrorMessage(
        error,
        "Project analysis could not be completed. Please try again.",
      );
      setAnalysisError(message);
      addToast({
        title: message.toLowerCase().includes("not configured")
          ? "Service not configured"
          : "Request failed",
        message: message.toLowerCase().includes("not configured")
          ? "Add the Analyse Project webhook configuration before trying again."
          : "The analysis could not be completed. Your saved project was not changed.",
        tone: "error",
      });
    } finally {
      setAnalysisLoading(false);
    }
  }

  function toggleAction(actionId: string) {
    updateProject(activeProject.id, (current) => {
      if (!current.analysis) return current;
      return {
        ...current,
        analysis: {
          ...current.analysis,
          actionItems: current.analysis.actionItems.map((action) =>
            action.id === actionId
              ? {
                  ...action,
                  status:
                    action.status === "completed" ? "pending" : "completed",
                }
              : action,
          ),
        },
      };
    });
  }

  async function checkScope() {
    const message = messageDraft.trim();
    if (!message) {
      setScopeError("Paste the new client message before checking the scope.");
      return;
    }
    if (!activeProject.analysis) {
      setScopeError("Analyse the project before checking a new request.");
      return;
    }
    setScopeError("");
    setScopeLoading(true);
    setScopeSaved(false);
    setCopyFeedback("");
    setScopeResult(null);
    try {
      const result = await checkScopeWithWebhook(activeProject, message);
      setScopeResult(result);
      addToast({
        title: "Scope check completed",
        message: "The new request has been compared with the project record.",
        tone: "success",
      });
    } catch (error) {
      const errorMessage = getWebhookErrorMessage(
        error,
        "The scope check could not be completed. Please try again.",
      );
      setScopeError(errorMessage);
      addToast({
        title: errorMessage.toLowerCase().includes("not configured")
          ? "Service not configured"
          : "Request failed",
        message: errorMessage.toLowerCase().includes("not configured")
          ? "Add the Scope Change webhook configuration before trying again."
          : "The scope check could not be completed. Your saved project was not changed.",
        tone: "error",
      });
    } finally {
      setScopeLoading(false);
    }
  }

  function saveScopeCheck() {
    if (!scopeResult || scopeSaved) return;
    updateProject(activeProject.id, (current) => ({
      ...current,
      scopeChecks: [scopeResult, ...current.scopeChecks],
    }));
    setScopeSaved(true);
    addToast({
      title: "Scope check saved",
      message: "The result and suggested reply are now in the project record.",
      tone: "success",
    });
  }

  async function copyText(
    text: string,
    target: "summary" | "explanation" | "reply",
    label: string,
  ) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedTarget(target);
      if (target === "reply") {
        setCopyFeedback("Reply copied to your clipboard.");
      }
      addToast({
        title: "Copied",
        message: `${label} copied to your clipboard.`,
        tone: "success",
      });
      window.setTimeout(() => {
        setCopiedTarget((current) => (current === target ? null : current));
      }, 2_000);
    } catch {
      if (target === "reply") {
        setCopyFeedback(
          "Copy was unavailable. Select the reply text and copy it manually.",
        );
      }
      addToast({
        title: "Copy unavailable",
        message: "Select the text and copy it manually.",
        tone: "error",
      });
    }
  }

  function exportProject() {
    const exportData = {
      exportedAt: new Date().toISOString(),
      project: {
        id: activeProject.id,
        name: activeProject.name,
        clientName: activeProject.clientName,
        description: activeProject.description,
        originalContext: activeProject.originalContext,
        analysis: activeProject.analysis,
        scopeChecks: activeProject.scopeChecks,
        createdAt: activeProject.createdAt,
        updatedAt: activeProject.updatedAt,
        isDemo: activeProject.isDemo ?? false,
      },
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeName =
      activeProject.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "project";
    link.href = url;
    link.download = `scopeguard-${safeName}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    addToast({
      title: "Project exported",
      message: "A private JSON copy was downloaded.",
      tone: "success",
    });
  }

  return (
    <div className="shell workspace page-space">
      <Link className="back-link" href="/projects">← All projects</Link>

      <div className="workspace-heading">
        <div>
          <div className="title-line">
            <h1>{project.name}</h1>
            {project.isDemo && <span className="status status-demo">Demo project</span>}
          </div>
          <p>{project.clientName} · Updated {dateFormatter.format(new Date(project.updatedAt))}</p>
        </div>
        <div className="workspace-actions" data-no-print>
          <span className="status status-device">Saved on this device</span>
          <button className="button button-secondary button-compact" type="button" onClick={exportProject}>Export JSON</button>
          <button className="button button-secondary button-compact" type="button" onClick={() => window.print()}>Print</button>
        </div>
      </div>

      <section className="overview-card">
        <div>
          <span className="micro-label">Project overview</span>
          <h2>{project.description}</h2>
        </div>
        <dl className="metric-grid">
          <div><dt>Original context</dt><dd>{project.originalContext ? "Saved" : "Not added"}</dd></div>
          <div><dt>Confirmed requirements</dt><dd>{confirmedCount}</dd></div>
          <div><dt>Scope checks</dt><dd>{project.scopeChecks.length}</dd></div>
          <div><dt>Latest risk</dt><dd><RiskBadge risk={latestRisk} /></dd></div>
          <div><dt>Last updated</dt><dd>{dateFormatter.format(new Date(project.updatedAt))}</dd></div>
        </dl>
      </section>

      {project.isDemo && (
        <div className="demo-notice">
          <strong>Fictional demo project</strong>
          <span>This example demonstrates the full project record and is not real client data.</span>
        </div>
      )}

      <ProjectActivityTimeline project={project} />

      <section className="workspace-section context-section">
        <div className="section-title-row">
          <div><span className="micro-label">Original agreement</span><h2>Client context</h2><p>Paste the project brief and message history that define the current agreement.</p></div>
          <span className="character-count" aria-live="polite">{contextDraft.length.toLocaleString()} characters</span>
        </div>
        {!activeProject.originalContext && !contextDraft && (
          <div className="compact-empty">
            <span aria-hidden="true">01</span>
            <div>
              <strong>No original context saved yet.</strong>
              <p>Add the brief or client message history to establish the project baseline.</p>
            </div>
          </div>
        )}
        <label className="sr-only" htmlFor="client-context">Original project brief and client message history</label>
        <textarea
          className="large-textarea"
          id="client-context"
          rows={10}
          value={contextDraft}
          onChange={(event) => {
            setContextDraft(event.target.value);
            setContextFeedback("");
          }}
          placeholder="Paste the original brief, key client messages, call notes, and confirmed decisions here…"
          aria-describedby="context-help"
          aria-invalid={Boolean(contextFeedback && !contextDraft.trim())}
        />
        <div className="editor-footer">
          <p
            id="context-help"
            className={contextFeedback && !contextDraft.trim() ? "form-alert" : contextFeedback ? "success-message" : ""}
            role={contextFeedback ? (contextDraft.trim() ? "status" : "alert") : undefined}
          >
            {contextFeedback || "Saved context remains on this device and becomes the baseline for project checks."}
          </p>
          <button className="button button-primary" type="button" onClick={saveContext}>Save Context</button>
        </div>
      </section>

      <AnalysisPanel
        analysis={project.analysis}
        loading={analysisLoading}
        canAnalyse={Boolean(project.originalContext)}
        error={analysisError}
        summaryCopied={copiedTarget === "summary"}
        onAnalyse={analyseProject}
        onCopySummary={() => {
          if (project.analysis) {
            void copyText(project.analysis.summary, "summary", "Project summary");
          }
        }}
        onToggleAction={toggleAction}
      />

      <section className="workspace-section message-section">
        <div className="section-title-row">
          <div><span className="micro-label">New client request</span><h2>Check for a scope change</h2><p>Compare a new client message with the structured project record.</p></div>
          {project.scopeChecks.length > 0 && <span className="history-count">{project.scopeChecks.length} saved {project.scopeChecks.length === 1 ? "check" : "checks"}</span>}
        </div>
        <label className="sr-only" htmlFor="new-client-message">New client message</label>
        <textarea
          className="large-textarea"
          id="new-client-message"
          rows={6}
          value={messageDraft}
          onChange={(event) => {
            setMessageDraft(event.target.value);
            setScopeError("");
            setScopeSaved(false);
            setScopeResult(null);
          }}
          placeholder="Paste the client’s latest request or change here…"
          aria-invalid={Boolean(scopeError)}
        />
        <div className="editor-footer">
          <p className={scopeError ? "form-alert" : ""} role={scopeError ? "alert" : undefined}>
            {scopeError || "The message is stored with the project only when you save the scope check."}
          </p>
          <button className="button button-primary" type="button" onClick={checkScope} disabled={scopeLoading}>
            {scopeLoading ? "Checking Scope…" : "Check for Scope Change"}
          </button>
        </div>
      </section>

      {scopeLoading && (
        <div className="scope-loading">
          <LoadingPanel kind="scope" compact />
        </div>
      )}

      {!scopeLoading && !scopeResult && project.scopeChecks.length === 0 && (
        <div className="compact-empty scope-empty">
          <span aria-hidden="true">00</span>
          <div>
            <strong>No scope checks saved yet.</strong>
            <p>Paste a new client request above to compare it with the confirmed project record.</p>
          </div>
        </div>
      )}

      {!scopeLoading && scopeResult && (
        <ScopeResult
          result={scopeResult}
          saved={scopeSaved}
          copyFeedback={copyFeedback}
          explanationCopied={copiedTarget === "explanation"}
          replyCopied={copiedTarget === "reply"}
          onCopyExplanation={() => {
            void copyText(
              scopeResult.explanation,
              "explanation",
              "Scope explanation",
            );
          }}
          onCopyReply={() => {
            void copyText(
              scopeResult.suggestedReply,
              "reply",
              "Suggested reply",
            );
          }}
          onSave={saveScopeCheck}
        />
      )}
    </div>
  );
}
