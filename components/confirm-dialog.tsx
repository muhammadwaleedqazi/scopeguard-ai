"use client";

import { useEffect, useRef } from "react";

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
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onCancel}>
      <div className="dialog" role="alertdialog" aria-modal="true" aria-labelledby="dialog-title" aria-describedby="dialog-description" onMouseDown={(event) => event.stopPropagation()}>
        <span className="dialog-icon" aria-hidden="true">!</span>
        <h2 id="dialog-title">Delete this project?</h2>
        <p id="dialog-description"><strong>{projectName}</strong> and its saved record will be permanently removed from this device.</p>
        <div className="dialog-actions">
          <button ref={cancelButtonRef} className="button button-secondary" type="button" onClick={onCancel}>Keep project</button>
          <button className="button button-danger" type="button" onClick={onConfirm}>Delete project</button>
        </div>
      </div>
    </div>
  );
}
