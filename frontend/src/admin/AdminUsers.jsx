import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import Navigation from "../components/Navigation";
import Styles from "./AdminUsers.module.css";
import NotesModal from "./NotesModel";
import toast from "react-hot-toast";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [username, setUsername] = useState("");
  const [id, setId] = useState("");
  const [selectedNotes, setSelectedNotes] = useState([]);
  const [showNotes, setShowNotes] = useState(false);

  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchUsers = async () => {
      const userData = JSON.parse(localStorage.getItem("userData") || "{}");

      if (!userData?.token) {
        toast.error("Authentication token missing. Please login again.");
        return;
      }

      setUsername(userData.name || "");
      setId(userData.id || "");

      const loadingToast = toast.loading("Loading users...");

      try {
        const res = await axios.get("http://localhost:8000/admin/users", {
          headers: { Authorization: `Bearer ${userData.token}` },
        });

        const normalUsers = (res.data?.users || []).filter(
          (user) => user?.role && user.role !== "admin" && user.role !== "mentor"
        );

        setUsers(normalUsers);

        if (normalUsers.length === 0) {
          toast("No users found", { id: loadingToast, icon: "ℹ️" });
        } else {
          toast.success("Users loaded successfully", { id: loadingToast });
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to fetch users", { id: loadingToast });
      }
    };

    fetchUsers();
  }, []);

  const handleDelete = (userId) => {
    if (!userId) return;
    toast((t) => (
      <span>
        Are you sure you want to delete this user?
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

              const loadingToast = toast.loading("Deleting user...");

              try {
                await axios.delete(`http://localhost:8000/admin/deleteUser/${userId}`, {
                  headers: { Authorization: `Bearer ${userData.token}` },
                });

                setUsers((prev) => prev.filter((u) => u._id !== userId));

                toast.success("User deleted successfully", { id: loadingToast });
              } catch (error) {
                toast.error(error.response?.data?.message || "Failed to delete user", { id: loadingToast });
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
              toast.error("User deletion cancelled");
            }}
          >
            Cancel
          </button>
        </div>
      </span>
    ));
  };

  const handleViewNotes = async (userId) => {
    if (!userId) return;

    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    if (!userData?.token) return;

    const loadingToast = toast.loading("Fetching notes...");

    try {
      const res = await axios.get("http://localhost:8000/admin/notes", {
        headers: { Authorization: `Bearer ${userData.token}` },
      });

      const userNotes = (res.data?.notes || []).filter((note) => note.user?._id === userId);
      setSelectedNotes(userNotes);
      setShowNotes(true);

      if (userNotes.length === 0) {
        toast("This user has no notes", { id: loadingToast, icon: "📄" });
      } else {
        toast.success("Notes loaded successfully", { id: loadingToast });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch notes", { id: loadingToast });
    }
  };

  return (
    <>
      <Navigation login="true" userName={username} id={id} />

      <div className={Styles.container}>
        <h2>All Users</h2>

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
            {users?.length === 0 ? (
              <tr>
                <td colSpan="7" className={Styles.emptyRow}>No users found</td>
              </tr>
            ) : (
              users.map((u, index) => (
                <tr key={u._id || index}>
                  <td>{index + 1}</td>
                  <td>{u.name || "N/A"}</td>
                  <td>{u.email || "N/A"}</td>
                  <td>{u.role || "N/A"}</td>
                  <td>{u.phone || "N/A"}</td>
                  <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "N/A"}</td>
                  <td className={Styles.actions}>
                    <button className={Styles.viewBtn} onClick={() => handleViewNotes(u._id)}>View Notes</button>
                    <button className={Styles.deleteBtn} onClick={() => handleDelete(u._id)}>Delete</button>
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