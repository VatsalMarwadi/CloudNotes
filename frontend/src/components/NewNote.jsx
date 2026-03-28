import React, { useState, useEffect } from "react";
import Styles from "./NewNote.module.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function NewNote() {
  const navigate = useNavigate();
  const [mentors, setMentors] = useState([]);
  const [selectedMentor, setSelectedMentor] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    content: "",
  });
  const [file, setFile] = useState(null);

  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
  const token = userData?.token;

  useEffect(() => {
    const fetchMentors = async () => {
      if (!token) return;
      try {
        const res = await axios.get("http://localhost:8000/getMentors", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMentors(res.data || []);
      } catch (err) {
        console.error("Error fetching mentors:", err);
      }
    };
    fetchMentors();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.error("You must be logged in");
      return;
    }

    if (!selectedMentor) {
      toast.error("Please select a mentor");
      return;
    }

    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    const data = new FormData();
    data.append("title", formData.title);
    data.append("content", formData.content || "");
    data.append("mentorId", selectedMentor);
    if (file) data.append("file", file);

    const createNotePromise = axios.post(
      "http://localhost:8000/createNote",
      data,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    toast.promise(createNotePromise, {
      loading: "Uploading note...",
      success: (res) => {
        setTimeout(() => navigate("/"), 800);
        return res.data?.message || "Note created successfully";
      },
      error: (err) => err.response?.data?.message || "Error creating note",
    });

    try {
      await createNotePromise;
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={Styles.container}>
      <form className={Styles.form} onSubmit={handleSubmit}>
        <h2>Create New Note</h2>

        <input
          type="text"
          name="title"
          placeholder="Enter Title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />

        <textarea
          name="content"
          placeholder="Enter Content"
          value={formData.content}
          onChange={(e) =>
            setFormData({ ...formData, content: e.target.value })
          }
        />

        <select
          value={selectedMentor}
          onChange={(e) => setSelectedMentor(e.target.value)}
          required
        >
          <option value="">Select Mentor</option>
          {mentors.map((mentor) => (
            <option key={mentor._id} value={mentor._id}>
              {mentor.name || "Unnamed Mentor"}
            </option>
          ))}
        </select>

        <input
          type="file"
          accept=".pdf,.doc,.docx,image/*,video/*"
          onChange={(e) => setFile(e.target.files[0])}
        />

        <button type="submit">Upload Note</button>
      </form>
    </div>
  );
}
