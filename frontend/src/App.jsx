import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import MyProfile from "./pages/MyProfile";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import NewNote from "./components/NewNote";
import MentorDashboard from "./pages/MentorDashboard";
import NoteDetails from "./pages/NoteDetails";
import { Toaster } from "react-hot-toast";
import AdminUsers from "./admin/AdminUsers";
import AdminDashboard from "./admin/AdminDashboard";
import AdminNotes from "./admin/AdminNotes";
import AdminNoteDetails from "./admin/AdminNotesDetails";
import AdminMentors from "./admin/AdminMentors";

export default function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/profile/:id" element={<MyProfile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<SignUp />} />
        <Route path="/createNote" element={<NewNote />} />
        <Route path="/mentor-dashboard" element={<MentorDashboard />} />
        <Route path="/note/:noteId/content/:index" element={<NoteDetails />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/notes" element={<AdminNotes />} />
        <Route path="/admin/notes/:noteId" element={<AdminNoteDetails />} />
        <Route path="/admin/mentors" element={<AdminMentors />} />

        {/* 404 */}
        <Route path="*" element={<h1>404 Not Found</h1>} />
      </Routes>

      {/* Toast notifications */}
      <Toaster
        position="bottom-center"
        reverseOrder={false}
        toastOptions={{ duration: 2000 }}
      />
    </div>
  );
}
