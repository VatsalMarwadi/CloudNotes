import Styles from "./LeftNav.module.css";
import { useNavigate } from "react-router-dom";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import SortIcon from "@mui/icons-material/Sort";
import { Menu, MenuItem, IconButton } from "@mui/material";
import { useState } from "react";
import toast from "react-hot-toast";

export default function LeftNav({
  notes = [],
  selectedNote = null,
  onSelectNote = () => {},
  searchQuery = "",
  setSearchQuery = () => {},
  onDeleteNote = () => {},
  onSortTitle = () => {},
  titleSortOrder = "asc",
}) {
  const navigate = useNavigate();

  const [menuAnchor, setMenuAnchor] = useState(null);
  const [activeNoteId, setActiveNoteId] = useState(null);

  const handleMenuOpen = (event, noteId) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setActiveNoteId(noteId);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setActiveNoteId(null);
  };

  // 🔴 Toast Confirmation for Delete
  const confirmDelete = (noteId) => {
    toast((t) => (
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <span>Are you sure you want to delete this note?</span>
        <div
          style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}
        >
          <button
            onClick={() => {
              onDeleteNote(noteId);
              toast.success("Note deleted successfully");
              toast.dismiss(t.id);
            }}
            style={{
              background: "#e53935",
              color: "white",
              border: "none",
              padding: "5px 12px",
              cursor: "pointer",
              borderRadius: "4px",
            }}
          >
            OK
          </button>

          <button
            onClick={() => {
              toast.error("Delete cancelled");
              toast.dismiss(t.id);
            }}
            style={{
              background: "#757575",
              color: "white",
              border: "none",
              padding: "5px 12px",
              cursor: "pointer",
              borderRadius: "4px",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    ));
  };

  return (
    <div className={Styles.container}>
      {/* SEARCH + SORT */}
      <div className={Styles.searchSortRow}>
        <input
          type="text"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={Styles.searchInput}
        />

        <IconButton onClick={onSortTitle}>
          <SortIcon />
        </IconButton>
      </div>

      {notes.length === 0 && <p>No Notes Found</p>}

      {notes.map((note) => (
        <div
          key={note._id || Math.random()}
          className={`${Styles.noteItem} ${
            selectedNote?._id === note._id ? Styles.activeNote : ""
          }`}
          onClick={() => onSelectNote(note)}
        >
          {note.title || "Untitled"}

          <MoreVertIcon
            className={Styles.menuIcon}
            onClick={(e) => handleMenuOpen(e, note._id)}
          />
        </div>
      ))}

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            confirmDelete(activeNoteId);
            handleMenuClose();
          }}
          sx={{ color: "red" }}
        >
          Delete Note
        </MenuItem>
      </Menu>

      <button
        className={Styles.createBtn}
        onClick={() => navigate("/createNote")}
      >
        Upload Note
      </button>
    </div>
  );
}
