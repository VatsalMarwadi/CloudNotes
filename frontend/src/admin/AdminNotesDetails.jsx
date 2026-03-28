import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Navigation from "../components/Navigation";
import Styles from "./AdminNotes.module.css";
import toast from "react-hot-toast";

import MoreVertIcon from "@mui/icons-material/MoreVert";
import { Menu, MenuItem, Dialog, DialogTitle, DialogContent, Button, Stack } from "@mui/material";

export default function AdminNoteDetails() {
  const { noteId } = useParams();
  const navigate = useNavigate();

  const [note, setNote] = useState(null);
  const [username, setUsername] = useState("");
  const [id, setId] = useState("");
  const [activeTab, setActiveTab] = useState("pending");

  const [menuAnchor, setMenuAnchor] = useState(null);
  const [activeIndex, setActiveIndex] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);

  const hasFetched = useRef(false);

  const fetchNote = async () => {
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    if (!userData?.token) {
      toast.error("Authentication token missing. Please login again.");
      return;
    }

    const loadingToast = toast.loading("Loading note...");

    try {
      const res = await axios.get(
        `http://localhost:8000/admin/notes/${noteId}`,
        { headers: { Authorization: `Bearer ${userData.token}` } }
      );

      setNote(res.data || null);
      toast.success("Note loaded successfully", { id: loadingToast });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load note", { id: loadingToast });
    }
  };

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    setUsername(userData?.name || "");
    setId(userData?.id || "");

    if (noteId) fetchNote();
  }, [noteId]);

  const handleDelete = () => {
    if (!noteId) return;

    toast((t) => (
      <span>
        Delete this note?
        <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
          <button
            style={{ background: "#22c55e", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "5px", cursor: "pointer" }}
            onClick={async () => {
              toast.dismiss(t.id);
              const userData = JSON.parse(localStorage.getItem("userData") || "{}");
              if (!userData?.token) return;
              const loadingToast = toast.loading("Deleting note...");

              try {
                await axios.delete(
                  `http://localhost:8000/admin/deleteNote/${noteId}`,
                  { headers: { Authorization: `Bearer ${userData.token}` } }
                );
                toast.success("Note deleted successfully", { id: loadingToast });
                navigate("/admin/notes");
              } catch (error) {
                toast.error(error.response?.data?.message || "Failed to delete note", { id: loadingToast });
              }
            }}
          >
            OK
          </button>

          <button
            style={{ background: "#ef4444", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "5px", cursor: "pointer" }}
            onClick={() => { toast.dismiss(t.id); toast.error("Note deletion cancelled"); }}
          >
            Cancel
          </button>
        </div>
      </span>
    ));
  };

  const handleMenuOpen = (event, index) => { event.stopPropagation(); setMenuAnchor(event.currentTarget); setActiveIndex(index); };
  const handleMenuClose = () => setMenuAnchor(null);

  const getGoogleViewerLink = (url) => url ? `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true&chrome=true` : "";

  const handleViewFile = () => {
    const item = note?.contents?.[activeIndex];
    if (!item?.filePath) return;
    window.open(getGoogleViewerLink(item.filePath), "_blank");
    toast.success("Opening file in Google Viewer");
    handleMenuClose();
  };

  const handleDownload = async () => {
    const item = note?.contents?.[activeIndex];
    if (!item?.filePath) return;
    const loadingToast = toast.loading("Preparing download...");

    try {
      const response = await fetch(item.filePath);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = item.fileName || "file";
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Download started", { id: loadingToast });
      window.URL.revokeObjectURL(url);
    } catch (error) {
      window.open(item.filePath, "_blank");
      toast.error("Download failed, opening file instead", { id: loadingToast });
    }
    handleMenuClose();
  };

  const handleShareLink = () => {
    const item = note?.contents?.[activeIndex];
    if (!item?.filePath) return;

    const viewerUrl = getGoogleViewerLink(item.filePath);
    const shareData = { title: item.fileName, text: `View file: ${item.fileName}`, url: viewerUrl };

    if (navigator.share) navigator.share(shareData).then(() => toast.success("File shared successfully"));
    else { navigator.clipboard.writeText(viewerUrl); toast.success("Share link copied to clipboard"); }

    setShareOpen(false);
  };

  const handleDeleteContent = () => {
    if (!noteId || activeIndex === null) return;

    toast((t) => (
      <span>
        Delete this file?
        <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
          <button
            style={{ background: "#22c55e", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "5px" }}
            onClick={async () => {
              toast.dismiss(t.id);
              const userData = JSON.parse(localStorage.getItem("userData") || "{}");
              if (!userData?.token) return;
              const loadingToast = toast.loading("Deleting file...");

              try {
                await axios.delete(`http://localhost:8000/admin/deleteContent/${noteId}/${activeIndex}`, {
                  headers: { Authorization: `Bearer ${userData.token}` },
                });
                toast.success("File deleted successfully", { id: loadingToast });
                fetchNote();
              } catch (error) {
                toast.error(error.response?.data?.message || "Failed to delete file", { id: loadingToast });
              }
            }}
          >
            OK
          </button>

          <button style={{ background: "#ef4444", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "5px" }} onClick={() => { toast.dismiss(t.id); toast.error("File deletion cancelled"); }}>
            Cancel
          </button>
        </div>
      </span>
    ));
  };

  if (!note) return (
    <>
      <Navigation login="true" userName={username} id={id} />
      <div className={Styles.container}><p>Loading note...</p></div>
    </>
  );

  const pendingContents = note.contents?.filter(c => c.status === "pending") || [];
  const completedContents = note.contents?.filter(c => c.status === "completed") || [];
  const currentContents = activeTab === "pending" ? pendingContents : completedContents;

  return (
    <>
      <Navigation login="true" userName={username} id={id} />
      <div className={Styles.container}>
        <div className={Styles.noteContainer}>
          <div className={Styles.noteHeader}>
            <div>
              <h2 className={Styles.noteTitle}>{note.title || "Untitled"}</h2>
              <p className={Styles.noteInfo}><strong>Owner:</strong> {note.user?.name || "N/A"}</p>
              <p className={Styles.noteInfo}><strong>Created On:</strong> {note.createdAt ? new Date(note.createdAt).toLocaleDateString() : "N/A"}</p>
            </div>
            <button className={Styles.deleteNoteBtn} onClick={handleDelete}>Delete Note</button>
          </div>

          <div className={Styles.tabs}>
            <button className={`${Styles.tabBtn} ${activeTab === "pending" ? Styles.tabActivePending : ""}`} onClick={() => setActiveTab("pending")}>
              Pending ({pendingContents.length})
            </button>
            <button className={`${Styles.tabBtn} ${activeTab === "completed" ? Styles.tabActiveCompleted : ""}`} onClick={() => setActiveTab("completed")}>
              Completed ({completedContents.length})
            </button>
          </div>

          {currentContents.map((content, idx) => {
            const originalIndex = note.contents.findIndex(c => c === content);
            return (
              <div key={originalIndex || idx} className={Styles.contentCard}>
                <div className={Styles.contentHeader}>
                  <p className={Styles.contentText}>{content?.text || "No content"}</p>
                  <MoreVertIcon className={Styles.menuIcon} onClick={(e) => handleMenuOpen(e, originalIndex)} />
                </div>
                {content?.mentor && <p className={Styles.mentorName}>Mentor: {content.mentor.name}</p>}
              </div>
            );
          })}

          <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}>
            <MenuItem onClick={handleViewFile}>View File</MenuItem>
            <MenuItem onClick={handleShareLink}>Share File</MenuItem>
            <MenuItem onClick={handleDownload}>Download File</MenuItem>
            <MenuItem onClick={handleDeleteContent} sx={{ color: "red" }}>Delete File</MenuItem>
          </Menu>
        </div>
      </div>
    </>
  );
}