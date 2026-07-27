import Link from "next/link";

const recordItems = [
  "Confirmed requirements",
  "Decisions and deadlines",
  "Open questions",
  "Client preferences",
];

const steps = [
  ["01", "Create a project", "Keep each client engagement in its own trusted workspace."],
  ["02", "Capture the agreement", "Paste the brief and conversations that define the work."],
  ["03", "Protect the scope", "Later, compare new requests with what was actually agreed."],
];

export default function HomePage() {
  return (
    <>
      <section className="hero shell">
        <div className="hero-copy">
          <div className="eyebrow"><span /> Scope clarity for independent work</div>
          <h1>Client agreements,<br /><em>finally in one place.</em></h1>
          <p className="hero-lede">
            ScopeGuard turns scattered briefs, messages, and decisions into a
            clear project record—so you can protect the work without damaging
            the relationship.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/projects/new">Create your first project <span>→</span></Link>
            <Link className="text-link" href="/projects">View project dashboard</Link>
          </div>
          <p className="local-note"><span>✓</span> Free MVP · No account required · Saved on this device</p>
        </div>
        <div className="hero-visual" aria-label="Example project scope record">
          <div className="record-card">
            <div className="record-top">
              <div>
                <span className="micro-label">Project record</span>
                <h2>Northstar brand refresh</h2>
              </div>
              <span className="status status-clear">Scope clear</span>
            </div>
            <div className="record-summary">
              <span className="record-icon">SG</span>
              <p>Website and visual identity refresh for the spring product launch.</p>
            </div>
            <div className="record-list">
              {recordItems.map((item, index) => (
                <div className="record-row" key={item}>
                  <span className="check">✓</span>
                  <span>{item}</span>
                  <b>{[6, 3, 2, 4][index]}</b>
                </div>
              ))}
            </div>
            <div className="scope-callout">
              <span className="scope-mark">!</span>
              <div><strong>New request detected</strong><p>“Could we add a client portal too?”</p></div>
              <span className="status status-medium">Medium risk</span>
            </div>
          </div>
          <div className="visual-stamp">A reliable record<br /><strong>for every project</strong></div>
        </div>
      </section>

      <section className="trust-strip">
        <div className="shell trust-content">
          <p>Built for people whose best work depends on clear expectations.</p>
          <div><span>Freelance designers</span><span>Developers</span><span>Consultants</span><span>Small studios</span></div>
        </div>
      </section>

      <section className="how shell">
        <div className="section-heading">
          <span className="micro-label">A calmer way to manage scope</span>
          <h2>Clarity before conflict.</h2>
          <p>Build a shared source of truth while the details are fresh, then return to it when a project changes.</p>
        </div>
        <div className="step-grid">
          {steps.map(([number, title, copy]) => (
            <article className="step-card" key={number}>
              <span className="step-number">{number}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="closing">
        <div className="shell closing-inner">
          <div><span className="micro-label light">Your work deserves a clear record</span><h2>Start the project on solid ground.</h2></div>
          <Link className="button button-light" href="/projects/new">Create a project <span>→</span></Link>
        </div>
      </section>
    </>
  );
}
