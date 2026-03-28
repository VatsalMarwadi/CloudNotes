import React from "react";
import styles from "./NotesModel.module.css";

export default function NotesModal({ notes, onClose }) {
  const safeNotes = Array.isArray(notes) ? notes : [];

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <div className={styles.modalHeader}>
          <h2>User Notes</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.modalContent}>
          {safeNotes.length === 0 ? (
            <p className={styles.noNotes}>No notes found.</p>
          ) : (
            safeNotes.map((note) => (
              <div key={note._id || Math.random()} className={styles.noteCard}>
                <h4 className={styles.noteTitle}>{note.title || "Untitled"}</h4>
                <p className={styles.noteInfo}><strong>Owner:</strong> {note.user?.name || "N/A"}</p>
                <p className={styles.noteInfo}><strong>Created On:</strong> {note.createdAt ? new Date(note.createdAt).toLocaleDateString() : "N/A"}</p>

                <div className={styles.contentSection}>
                  <strong>Contents:</strong>
                  {(note.contents || []).map((c, i) => (
                    <div key={i} className={styles.contentBox}>
                      <p className={styles.contentText}>{c?.text || "No content"}</p>
                      {c?.mentor && <p className={styles.mentor}><strong>Assigned Mentor:</strong> {c.mentor.name}</p>}
                      {c?.file && <p><a href={c.file} target="_blank" rel="noopener noreferrer" className={styles.fileLink}>View File</a></p>}
                      <p className={styles.status}><strong>Status:</strong> {c?.status || "Pending"}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}