import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Navigation from "../components/Navigation";
import Styles from "./NoteDetails.module.css";

export default function NoteDetails() {
  const { noteId, index } = useParams();
  const navigate = useNavigate();

  const [content, setContent] = useState(null);
  const [note, setNote] = useState(null);
  const [username, setUsername] = useState("");
  const [id, setId] = useState("");

  useEffect(() => {
    const fetchNote = async () => {
      const userData = JSON.parse(localStorage.getItem("userData"));

      // ✅ Validate user session
      if (!userData?.token || !userData?.id) {
        navigate("/login");
        return;
      }

      setUsername(userData.name || "");
      setId(userData.id || "");

      try {
        const res = await axios.get("http://localhost:8000/notes", {
          headers: {
            Authorization: `Bearer ${userData.token}`,
          },
        });

        if (!res?.data?.notes) {
          toast.error("Failed to fetch notes");
          navigate("/");
          return;
        }

        const foundNote = res.data.notes.find((n) => n._id === noteId);

        // ✅ Validate note existence
        if (
          foundNote &&
          foundNote.contents &&
          foundNote.contents.length > index
        ) {
          setNote(foundNote);
          setContent(foundNote.contents[index]);
        } else {
          toast.error("Note not found or invalid index");
          navigate("/");
        }
      } catch (error) {
        console.log(error);
        toast.error("Failed to load note");
        navigate("/");
      }
    };

    fetchNote();
  }, [noteId, index, navigate]);

  if (!content || !note) return <div>Loading...</div>;

  return (
    <div>
      <Navigation
        login="true"
        title="MyNotes For Revision"
        userName={username}
        id={id}
      />

      <div className={Styles.container}>
        <h2 className={Styles.title}>{note.title || ""}</h2>

        {/* Mentor & Status */}
        <div className={Styles.mentorBox}>
          <div className={Styles.mentorInfo}>
            <strong>Assigned Mentor:</strong>{" "}
            {content.mentor?.name || "Not Assigned"}
          </div>

          <div
            className={`${Styles.status} ${
              content.status === "completed" ? Styles.completed : Styles.pending
            }`}
          >
            {content.status === "completed" ? "Completed" : "Pending"}
          </div>
        </div>

        {/* File Card */}
        <div className={Styles.fileCard}>
          <div className={Styles.fileRow}>
            <span className={Styles.label}>File Name:</span>
            <div className={Styles.fileRowContent}>
              {content.fileName || ""}
            </div>
          </div>

          {content.text && (
            <div className={Styles.fileRow}>
              <span className={Styles.label}>Text:</span>
              <div className={Styles.fileRowContent}>{content.text}</div>
            </div>
          )}

          {content.mentorReply && (
            <div className={Styles.replyBox}>
              <div className={Styles.replyTitle}>Mentor Assessment</div>
              <p>{content.mentorReply}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
