"use client";

export function ConfirmDialog({
  open,
  projectName,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  projectName: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onCancel}>
      <div className="dialog" role="alertdialog" aria-modal="true" aria-labelledby="dialog-title" onMouseDown={(event) => event.stopPropagation()}>
        <span className="dialog-icon">!</span>
        <h2 id="dialog-title">Delete this project?</h2>
        <p><strong>{projectName}</strong> and its saved record will be permanently removed from this device.</p>
        <div className="dialog-actions">
          <button className="button button-secondary" onClick={onCancel}>Keep project</button>
          <button className="button button-danger" onClick={onConfirm}>Delete project</button>
        </div>
      </div>
    </div>
  );
}
