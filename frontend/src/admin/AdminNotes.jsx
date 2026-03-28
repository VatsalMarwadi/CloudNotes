import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import Styles from "./AdminNotes.module.css";
import toast from "react-hot-toast";

export default function AdminNotes() {
  const [notes, setNotes] = useState([]);
  const [username, setUsername] = useState("");
  const [id, setId] = useState("");
  const navigate = useNavigate();
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchNotes = async () => {
      const userData = JSON.parse(localStorage.getItem("userData") || "{}");
      if (!userData?.token) {
        toast.error("Authentication token missing. Please login again.");
        return;
      }

      setUsername(userData.name || "");
      setId(userData.id || "");

      const loadingToast = toast.loading("Loading notes...");

      try {
        const res = await axios.get("http://localhost:8000/admin/notes", {
          headers: { Authorization: `Bearer ${userData.token}` },
        });

        const notesData = res.data?.notes || [];
        setNotes(notesData);

        if (notesData.length === 0) {
          toast("No notes found", { id: loadingToast, icon: "📄" });
        } else {
          toast.success("Notes loaded successfully", { id: loadingToast });
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to fetch notes", { id: loadingToast });
      }
    };

    fetchNotes();
  }, []);

  const handleDelete = (noteId) => {
    if (!noteId) return;

    toast((t) => (
      <span>
        Are you sure you want to delete this note?
        <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
          <button
            style={{ background: "#22c55e", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "5px", cursor: "pointer" }}
            onClick={async () => {
              toast.dismiss(t.id);
              const userData = JSON.parse(localStorage.getItem("userData") || "{}");
              if (!userData?.token) return;
              const loadingToast = toast.loading("Deleting note...");
              try {
                await axios.delete(`http://localhost:8000/admin/deleteNote/${noteId}`, {
                  headers: { Authorization: `Bearer ${userData.token}` },
                });
                setNotes((prev) => prev.filter((note) => note._id !== noteId));
                toast.success("Note deleted successfully", { id: loadingToast });
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

  return (
    <>
      <Navigation login="true" userName={username} id={id} />
      <div className={Styles.container}>
        <h2>All Notes</h2>
        {notes?.length === 0 ? (
          <p>No notes found.</p>
        ) : (
          <table className={Styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Owner</th>
                <th>Created On</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {notes.map((note, index) => (
                <tr key={note._id || index}>
                  <td>{index + 1}</td>
                  <td>{note.title || "N/A"}</td>
                  <td>{note.user?.name || "N/A"}</td>
                  <td>{note.createdAt ? new Date(note.createdAt).toLocaleDateString() : "N/A"}</td>
                  <td>{note.status || "Pending"}</td>
                  <td>
                    <button className={Styles.viewBtn} onClick={() => note._id && navigate(`/admin/notes/${note._id}`)}>View</button>
                    <button className={Styles.deleteBtn} onClick={() => handleDelete(note._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}