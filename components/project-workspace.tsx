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
  ProjectAnalysis,
  Requirement,
  RiskLevel,
  ScopeCheck,
  ScopeFinding,
} from "@/types/project";
import { useProjects } from "./project-provider";

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

function DecisionList({ decisions }: { decisions: Decision[] }) {
  if (!decisions.length) {
    return <p className="section-empty">No decisions have been recorded.</p>;
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
  onAnalyse,
  onToggleAction,
}: {
  analysis?: ProjectAnalysis;
  loading: boolean;
  canAnalyse: boolean;
  error: string;
  onAnalyse: () => void;
  onToggleAction: (id: string) => void;
}) {
  if (loading) {
    return (
      <section className="analysis-shell" aria-live="polite">
        <div className="inline-loading"><span /><div><strong>Structuring the project record</strong><p>Reviewing the saved context and organizing the agreement…</p></div></div>
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

  const confirmed = analysis.requirements.filter(
    (requirement) => requirement.status === "confirmed",
  );
  const needsAttention = analysis.requirements.filter(
    (requirement) => requirement.status !== "confirmed",
  );

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
        <span className="section-kicker">Project summary</span>
        <p>{analysis.summary}</p>
      </article>

      <div className="analysis-grid">
        <article className="analysis-card analysis-card-wide">
          <div className="analysis-card-title"><span>01</span><h3>Confirmed requirements</h3><b>{confirmed.length}</b></div>
          <RequirementList requirements={confirmed} emptyCopy="No confirmed requirements were identified." />
        </article>
        <article className="analysis-card analysis-card-wide">
          <div className="analysis-card-title"><span>02</span><h3>Proposed or unclear</h3><b>{needsAttention.length}</b></div>
          <RequirementList requirements={needsAttention} emptyCopy="No proposed or unclear requirements were identified." />
        </article>
        <article className="analysis-card">
          <div className="analysis-card-title"><span>03</span><h3>Decisions</h3><b>{analysis.decisions.length}</b></div>
          <DecisionList decisions={analysis.decisions} />
        </article>
        <article className="analysis-card">
          <div className="analysis-card-title"><span>04</span><h3>Deadlines</h3><b>{analysis.deadlines.length}</b></div>
          {analysis.deadlines.length ? (
            <ul className="record-items">
              {analysis.deadlines.map((deadline) => (
                <li key={deadline.id}>
                  <span className="item-primary">{deadline.task}</span>
                  <span className="item-meta">{deadline.date}</span>
                  <Evidence>{deadline.evidence}</Evidence>
                </li>
              ))}
            </ul>
          ) : <p className="section-empty">No deadlines were identified.</p>}
        </article>
        <article className="analysis-card analysis-card-wide">
          <div className="analysis-card-title"><span>05</span><h3>Action items</h3><b>{analysis.actionItems.length}</b></div>
          {analysis.actionItems.length ? (
            <ul className="action-list">
              {analysis.actionItems.map((action) => (
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
          ) : <p className="section-empty">No action items were identified.</p>}
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
            <li key={item.id}><strong>{item.text}</strong><p>{item.reason}</p></li>
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
  onCopy,
  onSave,
}: {
  result: ScopeCheck;
  saved: boolean;
  copyFeedback: string;
  onCopy: () => void;
  onSave: () => void;
}) {
  return (
    <section className={`scope-result scope-result-${result.riskLevel}`} aria-live="polite">
      <div className="scope-result-heading">
        <div>
          <span className="micro-label">Scope review</span>
          <h2>{result.isScopeChange ? "Possible scope change detected" : "No material scope change detected"}</h2>
          <p>{result.explanation}</p>
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
        <div className="reply-heading"><div><span className="section-kicker">Suggested professional reply</span><h3>Respond clearly, without escalating tension.</h3></div><button className="button button-secondary button-compact" type="button" onClick={onCopy}>Copy Reply</button></div>
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
    } catch (error) {
      setAnalysisError(
        getWebhookErrorMessage(
          error,
          "Project analysis could not be completed. Please try again.",
        ),
      );
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
    } catch (error) {
      setScopeError(
        getWebhookErrorMessage(
          error,
          "The scope check could not be completed. Please try again.",
        ),
      );
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
  }

  async function copyReply() {
    if (!scopeResult) return;
    try {
      await navigator.clipboard.writeText(scopeResult.suggestedReply);
      setCopyFeedback("Reply copied to your clipboard.");
    } catch {
      setCopyFeedback("Copy was unavailable. Select the reply text and copy it manually.");
    }
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
        <span className="status status-device">Saved on this device</span>
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

      <section className="workspace-section context-section">
        <div className="section-title-row">
          <div><span className="micro-label">Original agreement</span><h2>Client context</h2><p>Paste the project brief and message history that define the current agreement.</p></div>
          <span className="character-count" aria-live="polite">{contextDraft.length.toLocaleString()} characters</span>
        </div>
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
        onAnalyse={analyseProject}
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
        <div className="inline-loading scope-loading" aria-live="polite">
          <span /><div><strong>Comparing the new request</strong><p>Checking deliverables, decisions, and timing…</p></div>
        </div>
      )}

      {!scopeLoading && scopeResult && (
        <ScopeResult
          result={scopeResult}
          saved={scopeSaved}
          copyFeedback={copyFeedback}
          onCopy={copyReply}
          onSave={saveScopeCheck}
        />
      )}
    </div>
  );
}
