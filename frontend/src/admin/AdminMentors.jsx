import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import Navigation from "../components/Navigation";
import Styles from "./AdminUsers.module.css";
import NotesModal from "./NotesModel";
import toast from "react-hot-toast";

export default function AdminMentors() {
  const [mentors, setMentors] = useState([]);
  const [username, setUsername] = useState("");
  const [id, setId] = useState("");
  const [selectedNotes, setSelectedNotes] = useState([]);
  const [showNotes, setShowNotes] = useState(false);

  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchMentors = async () => {
      const userData = JSON.parse(localStorage.getItem("userData") || "{}");

      if (!userData?.token) {
        toast.error("Authentication token missing. Please login again.");
        return;
      }

      setUsername(userData.name || "");
      setId(userData.id || "");

      const loadingToast = toast.loading("Loading mentors...");

      try {
        const res = await axios.get("http://localhost:8000/admin/users", {
          headers: { Authorization: `Bearer ${userData.token}` },
        });

        const mentorUsers = (res.data?.users || []).filter(
          (user) => user?.role === "mentor"
        );

        setMentors(mentorUsers);

        if (mentorUsers.length === 0) {
          toast("No mentors found", { id: loadingToast, icon: "ℹ️" });
        } else {
          toast.success("Mentors loaded successfully", { id: loadingToast });
        }
      } catch (error) {
        toast.error(
          error.response?.data?.message || "Failed to fetch mentors",
          { id: loadingToast }
        );
      }
    };

    fetchMentors();
  }, []);

  const handleDelete = (mentorId) => {
    if (!mentorId) return;

    toast((t) => (
      <span>
        Are you sure you want to delete this mentor?
        <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
          <button
            style={{
              background: "#22c55e",
              color: "white",
              border: "none",
              padding: "6px 12px",
              borderRadius: "5px",
              cursor: "pointer",
            }}
            onClick={async () => {
              toast.dismiss(t.id);

              const userData = JSON.parse(localStorage.getItem("userData") || "{}");
              if (!userData?.token) return;

              const loadingToast = toast.loading("Deleting mentor...");

              try {
                await axios.delete(
                  `http://localhost:8000/admin/deleteUser/${mentorId}`,
                  { headers: { Authorization: `Bearer ${userData.token}` } }
                );

                setMentors((prev) => prev.filter((m) => m._id !== mentorId));

                toast.success("Mentor deleted successfully", { id: loadingToast });
              } catch (error) {
                toast.error(
                  error.response?.data?.message || "Failed to delete mentor",
                  { id: loadingToast }
                );
              }
            }}
          >
            OK
          </button>

          <button
            style={{
              background: "#ef4444",
              color: "white",
              border: "none",
              padding: "6px 12px",
              borderRadius: "5px",
              cursor: "pointer",
            }}
            onClick={() => {
              toast.dismiss(t.id);
              toast.error("Mentor deletion cancelled");
            }}
          >
            Cancel
          </button>
        </div>
      </span>
    ));
  };

  const handleViewNotes = async (mentorId) => {
    if (!mentorId) return;

    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    if (!userData?.token) return;

    const loadingToast = toast.loading("Fetching notes...");

    try {
      const res = await axios.get("http://localhost:8000/admin/notes", {
        headers: { Authorization: `Bearer ${userData.token}` },
      });

      const mentorNotes = (res.data?.notes || [])
        .map((note) => {
          const filteredContents = (note.contents || []).filter(
            (content) => content?.mentor?._id === mentorId
          );
          if (filteredContents.length > 0) return { ...note, contents: filteredContents };
          return null;
        })
        .filter(Boolean);

      setSelectedNotes(mentorNotes);
      setShowNotes(true);

      if (mentorNotes.length === 0) {
        toast("This mentor has no notes", { id: loadingToast, icon: "📄" });
      } else {
        toast.success("Notes loaded successfully", { id: loadingToast });
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to fetch notes",
        { id: loadingToast }
      );
    }
  };

  return (
    <>
      <Navigation login="true" userName={username} id={id} />

      <div className={Styles.container}>
        <h2>All Mentors</h2>

        <table className={Styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Phone</th>
              <th>Registered At</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {mentors?.length === 0 ? (
              <tr>
                <td colSpan="7" className={Styles.emptyRow}>No mentors found</td>
              </tr>
            ) : (
              mentors.map((m, index) => (
                <tr key={m._id || index}>
                  <td>{index + 1}</td>
                  <td>{m.name || "N/A"}</td>
                  <td>{m.email || "N/A"}</td>
                  <td>{m.role || "N/A"}</td>
                  <td>{m.phone || "N/A"}</td>
                  <td>{m.createdAt ? new Date(m.createdAt).toLocaleDateString() : "N/A"}</td>
                  <td className={Styles.actions}>
                    <button className={Styles.viewBtn} onClick={() => handleViewNotes(m._id)}>View Notes</button>
                    <button className={Styles.deleteBtn} onClick={() => handleDelete(m._id)}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showNotes && <NotesModal notes={selectedNotes || []} onClose={() => setShowNotes(false)} />}
    </>
  );
}