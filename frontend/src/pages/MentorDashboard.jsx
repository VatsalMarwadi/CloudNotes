import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import styles from "./MentorDashboard.module.css";
import toast from "react-hot-toast";

const MentorDashboard = () => {
  const navigate = useNavigate();

  const [notes, setNotes] = useState([]);
  const [username, setUsername] = useState("");
  const [id, setId] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [replies, setReplies] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const hasLoaded = useRef(false);

  // =========================
  // AUTH + FETCH NOTES
  // =========================
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("userData"));
    const token = userData?.token;
    const role = userData?.role;

    if (!token) return navigate("/login");
    if (role !== "mentor") return navigate("/");

    setUsername(userData.name);
    setId(userData.id);

    if (!hasLoaded.current) {
      fetchNotes(token, true);
      hasLoaded.current = true;
    }
  }, [navigate]);

  const fetchNotes = async (token, showToast = false) => {
    const toastId = showToast ? toast.loading("Loading notes...") : null;

    try {
      const res = await axios.get("http://localhost:8000/notes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotes(res.data.notes || []);
      if (showToast)
        toast.success("Notes loaded successfully", { id: toastId });
    } catch (error) {
      if (showToast) toast.error("Failed to load notes", { id: toastId });
      console.error(error);
    }
  };

  // =========================
  // HANDLE MENTOR REPLY
  // =========================
  const handleReply = async (noteId, contentId, reply) => {
    if (!reply?.trim()) return toast.error("Reply cannot be empty");

    const toastId = toast.loading("Submitting assessment...");

    try {
      const userData = JSON.parse(localStorage.getItem("userData"));
      await axios.put(
        `http://localhost:8000/mentor/reply/${noteId}/${contentId}`,
        { reply },
        { headers: { Authorization: `Bearer ${userData.token}` } },
      );

      fetchNotes(userData.token);
      setReplies({});
      toast.success("Assessment submitted", { id: toastId });
    } catch (error) {
      toast.error("Failed to submit reply", { id: toastId });
      console.error(error);
    }
  };

  // =========================
  // SEARCH NOTES
  // =========================
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      const userData = JSON.parse(localStorage.getItem("userData"));
      const token = userData?.token;
      if (!token) return;

      if (searchQuery.trim()) {
        axios
          .get(`http://localhost:8000/searchNotes?query=${searchQuery}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          .then((res) => {
            setNotes(res.data.notes || []);
            toast.success(`${res.data.notes.length} notes found`);
          })
          .catch(() => toast.error("Search failed"));
      } else {
        fetchNotes(token);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // =========================
  // COUNT PENDING & COMPLETED
  // =========================
  const pendingCount = notes.reduce(
    (sum, note) =>
      sum + note.contents.filter((c) => c.status === "pending").length,
    0,
  );
  const completedCount = notes.reduce(
    (sum, note) =>
      sum + note.contents.filter((c) => c.status === "completed").length,
    0,
  );

  // =========================
  // FILTER CONTENTS BY TAB
  // =========================
  const filteredContents = notes.flatMap((note) =>
    note.contents
      .filter((content) =>
        activeTab === "pending"
          ? content.status === "pending"
          : content.status === "completed",
      )
      .map((content) => ({ ...content, note })),
  );

  // =========================
  // RENDER
  // =========================
  return (
    <div>
      <Navigation
        login="true"
        title="Mentor Dashboard"
        userName={username}
        id={id}
      />

      <div className={styles.container}>
        {/* TABS + SEARCH */}
        <div className={styles.tabsContainer}>
          <div className={styles.tabs}>
            <button
              className={`${styles.tabButton} ${
                activeTab === "pending" ? styles.activePending : ""
              }`}
              onClick={() => setActiveTab("pending")}
            >
              Pending ({pendingCount})
            </button>
            <button
              className={`${styles.tabButton} ${
                activeTab === "completed" ? styles.activeCompleted : ""
              }`}
              onClick={() => setActiveTab("completed")}
            >
              Completed ({completedCount})
            </button>
          </div>
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* NOTES DISPLAY */}
        {filteredContents.length === 0 ? (
          <div className={styles.emptyState}>
            {activeTab === "pending"
              ? "No pending notes"
              : "No completed notes"}
          </div>
        ) : (
          filteredContents.map((content) => {
            const note = content.note;

            return (
              <div
                key={content._id}
                className={styles.contentBlock}
                onClick={(e) => {
                  if (
                    e.target.closest("textarea") ||
                    e.target.closest("button")
                  )
                    return;
                  if (!content.filePath) return;

                  const previewUrl = `https://docs.google.com/viewerng/viewer?embedded=true&url=${encodeURIComponent(
                    content.filePath,
                  )}`;
                  toast.success("Opening file in new tab");
                  window.open(previewUrl, "_blank");
                }}
                style={{ cursor: content.filePath ? "pointer" : "default" }}
              >
                <div className={styles.noteCard}>
                  <div className={styles.noteHeader}>
                    <h3 className={styles.noteTitle}>{note.title}</h3>
                    <span
                      className={
                        content.status === "completed"
                          ? styles.statusCompleted
                          : styles.statusPending
                      }
                    >
                      {content.status}
                    </span>
                  </div>
                  <p className={styles.uploader}>
                    Uploaded By: {note.user?.name}
                  </p>
                  {content.text && (
                    <p className={styles.contentText}>{content.text}</p>
                  )}

                  {content.status === "pending" && (
                    <div
                      className={styles.replySection}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <textarea
                        placeholder="Write assessment..."
                        className={styles.textarea}
                        value={replies[content._id] || ""}
                        onChange={(e) =>
                          setReplies({
                            ...replies,
                            [content._id]: e.target.value,
                          })
                        }
                        onInput={(e) => {
                          e.target.style.height = "auto";
                          e.target.style.height = `${e.target.scrollHeight}px`;
                        }}
                        rows={1}
                      />
                      <button
                        className={styles.replyButton}
                        onClick={() =>
                          handleReply(
                            note._id,
                            content._id,
                            replies[content._id],
                          )
                        }
                        disabled={!replies[content._id]?.trim()}
                      >
                        Submit
                      </button>
                    </div>
                  )}

                  {content.status === "completed" && (
                    <div
                      className={styles.assessmentBox}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <strong>Assessment:</strong>
                      <p>{content.mentorReply}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MentorDashboard;
