import React, { useEffect, useState, useRef } from "react";
import Navigation from "../components/Navigation";
import { useNavigate } from "react-router-dom";
import Styles from "./Home.module.css";
import LeftNav from "../components/LeftNav";
import axios from "axios";
import toast from "react-hot-toast";
import SortIcon from "@mui/icons-material/Sort";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import {
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Stack,
} from "@mui/material";

export default function Home() {
  const navigate = useNavigate();
  const hasFetched = useRef(false);

  const [username, setUsername] = useState("");
  const [id, setId] = useState("");
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [titleSortOrder, setTitleSortOrder] = useState("asc");
  const [contentSortOrder, setContentSortOrder] = useState("asc");

  const [menuAnchor, setMenuAnchor] = useState(null);
  const [activeIndex, setActiveIndex] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);

  // ==============================
  // AUTH + FETCH NOTES
  // ==============================
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    const token = userData?.token;
    const role = userData?.role;

    if (!token) return navigate("/login");

    if (role === "admin") return navigate("/admin");
    if (role === "mentor") return navigate("/mentor-dashboard");

    setUsername(userData.name || "");
    setId(userData.id || "");
    fetchNotes(token);
  }, [navigate]);

  const fetchNotes = async (token) => {
    try {
      const res = await axios.get("http://localhost:8000/notes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotes(res.data.notes || []);
      setSelectedNote(res.data.notes?.[0] || null);
      hasFetched.current = true;
    } catch (error) {
      console.error(error);
      toast.error("Failed to load notes");
    }
  };

  // ==============================
  // DELETE NOTE
  // ==============================
  const handleDeleteNote = async (noteId) => {
    const token = JSON.parse(localStorage.getItem("userData"))?.token;
    if (!token) return;

    const deletePromise = axios.delete(
      `http://localhost:8000/deleteNote/${noteId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    toast.promise(deletePromise, {
      loading: "Deleting note...",
      success: () => {
        const updatedNotes = notes.filter((n) => n._id !== noteId);
        setNotes(updatedNotes);
        setSelectedNote(updatedNotes[0] || null);
        return "Note deleted successfully";
      },
      error: "Failed to delete note",
    });

    try {
      await deletePromise;
    } catch (err) {
      console.error(err);
    }
  };

  // ==============================
  // FILE ACTIONS: DOWNLOAD, VIEW, SHARE, DELETE
  // ==============================
  const getActiveItem = () => selectedNote?.contents?.[activeIndex] || null;

  const handleDownload = async () => {
    const item = getActiveItem();
    if (!item?.filePath) return;

    const toastId = toast.loading("Downloading file...");

    try {
      const response = await fetch(item.filePath);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = item.fileName || "file";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Download started", { id: toastId });
    } catch (err) {
      toast.error("Download failed", { id: toastId });
      window.open(item.filePath, "_blank");
    }
  };

  const getGoogleViewerLink = (url) =>
    url
      ? `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true&chrome=true`
      : "";

  const handleViewFile = () => {
    const item = getActiveItem();
    if (!item?.filePath) return;

    window.open(
      getGoogleViewerLink(item.filePath),
      "_blank",
      "noopener,noreferrer",
    );
    handleMenuClose();
  };

  const handleShareLink = () => {
    const item = getActiveItem();
    if (!item?.filePath) return;

    const viewerUrl = getGoogleViewerLink(item.filePath);
    if (navigator.share)
      navigator
        .share({ title: item.fileName, text: item.fileName, url: viewerUrl })
        .catch(() => {});
    else {
      navigator.clipboard.writeText(viewerUrl);
      toast.success("Link copied to clipboard");
    }
    setShareOpen(false);
  };

  const handleDeleteContent = (noteId, index) => {
    toast((t) => (
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <span>Delete this file?</span>
        <div
          style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}
        >
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              const token = JSON.parse(localStorage.getItem("userData"))?.token;
              if (!token) return;

              const deletePromise = axios.delete(
                `http://localhost:8000/deleteContent/${noteId}/${index}`,
                { headers: { Authorization: `Bearer ${token}` } },
              );

              toast.promise(deletePromise, {
                loading: "Deleting file...",
                success: (res) => {
                  const updatedNotes = notes.map((n) =>
                    n._id === noteId ? res.data.note : n,
                  );
                  setNotes(updatedNotes);
                  setSelectedNote(res.data.note);
                  handleMenuClose();
                  return "File deleted successfully";
                },
                error: "Failed to delete file",
              });

              try {
                await deletePromise;
              } catch (err) {
                console.error(err);
              }
            }}
            style={{
              background: "#e53935",
              color: "#fff",
              border: "none",
              padding: "5px 12px",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Delete
          </button>

          <button
            onClick={() => toast.dismiss(t.id)}
            style={{
              background: "#757575",
              color: "#fff",
              border: "none",
              padding: "5px 12px",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    ));
  };

  // ==============================
  // MENU HANDLERS
  // ==============================
  const handleMenuOpen = (event, index) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setActiveIndex(index);
  };
  const handleMenuClose = () => setMenuAnchor(null);

  // ==============================
  // SEARCH & SORT
  // ==============================
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      const token = JSON.parse(localStorage.getItem("userData"))?.token;
      if (!token) return;

      if (searchQuery) {
        try {
          const res = await axios.get(
            `http://localhost:8000/searchNotes?query=${searchQuery}`,
            { headers: { Authorization: `Bearer ${token}` } },
          );
          setNotes(res.data.notes || []);
          setSelectedNote(res.data.notes?.[0] || null);
          toast.success(`${res.data.notes?.length || 0} notes found`);
        } catch (err) {
          console.error(err);
        }
      } else fetchNotes(token);
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleSortByTitle = async () => {
    const token = JSON.parse(localStorage.getItem("userData"))?.token;
    if (!token) return;

    const newOrder = titleSortOrder === "asc" ? "desc" : "asc";
    try {
      const res = await axios.get(
        `http://localhost:8000/sortByTitle?order=${newOrder}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setNotes(res.data.notes || []);
      setSelectedNote(res.data.notes?.[0] || null);
      setTitleSortOrder(newOrder);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSortByContent = async () => {
    if (!selectedNote?._id) return;
    const token = JSON.parse(localStorage.getItem("userData"))?.token;
    if (!token) return;

    const newOrder = contentSortOrder === "asc" ? "desc" : "asc";
    try {
      const res = await axios.get(
        `http://localhost:8000/sortContents/${selectedNote._id}?order=${newOrder}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const updatedNotes = notes.map((n) =>
        n._id === selectedNote._id ? res.data.note : n,
      );
      setNotes(updatedNotes);
      setSelectedNote(res.data.note);
      setContentSortOrder(newOrder);
    } catch (err) {
      console.error(err);
    }
  };

  // ==============================
  // UI
  // ==============================
  return (
    <div>
      <Navigation
        login="true"
        title="MyNotes For Revision"
        userName={username}
        id={id}
      />
      <div className={Styles.container}>
        <div className={Styles.left}>
          <LeftNav
            notes={notes}
            selectedNote={selectedNote}
            onSelectNote={setSelectedNote}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onDeleteNote={handleDeleteNote}
            onSortTitle={handleSortByTitle}
            titleSortOrder={titleSortOrder}
          />
        </div>

        <div className={Styles.right}>
          <div className={Styles.rightHeader}>
            <button
              className={Styles.sortIconBtn}
              onClick={handleSortByContent}
            >
              <SortIcon />
            </button>
          </div>

          {selectedNote?.contents?.length ? (
            selectedNote.contents.map((item, index) => (
              <div
                key={index}
                className={`${Styles.contentCard} ${item.status === "completed" ? Styles.completedCard : Styles.pendingCard}`}
                onClick={() =>
                  navigate(`/note/${selectedNote._id}/content/${index}`)
                }
              >
                <div className={Styles.contentHeader}>
                  <h4>{item.text || "No Title"}</h4>
                  <span
                    className={
                      item.status === "completed"
                        ? Styles.statusCompleted
                        : Styles.statusPending
                    }
                  >
                    {item.status === "completed" ? "Assessed" : "Pending"}
                  </span>
                  <MoreVertIcon
                    className={Styles.menuIcon}
                    onClick={(e) => handleMenuOpen(e, index)}
                  />
                </div>
              </div>
            ))
          ) : (
            <p>No content available</p>
          )}

          {/* MENU */}
          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleViewFile}>View File</MenuItem>
            <MenuItem onClick={handleShareLink}>Share File</MenuItem>
            <MenuItem
              onClick={() => {
                handleDownload();
                handleMenuClose();
              }}
            >
              Download File
            </MenuItem>
            <MenuItem
              onClick={() => handleDeleteContent(selectedNote._id, activeIndex)}
              sx={{ color: "red" }}
            >
              Delete File
            </MenuItem>
          </Menu>
        </div>
      </div>
    </div>
  );
}
