import express from "express";
import { getProfile, loginUser, registerUser, updateUser } from "../controllers/userController.mjs";
import { authentication, authorization } from "../auth/authentication.mjs";
import { createNotes, deleteNotes, getNotes, updateNotes, deleteSingleContent, searchNotes, mentorReply, getProfileStats, getMentorProfileStats, getMentors, sortNotesByTitle, sortContentsByText } from "../controllers/notesController.mjs";
import { getAllNotes, getAllUsers, getAdminStats, deleteUser, getAdminNoteById, deleteAdminNote, deleteAdminSingleContent } from "../controllers/adminController.mjs";
import { upload } from "../controllers/notesController.mjs";

const router = express.Router();

router.get('/', (req, res) => { res.send("Hello World!!!"); });

/* ================= AUTH ROUTES ================= */

router.post("/register", registerUser);
router.post("/login", loginUser);

/* ================= PROFILE ================= */

router.get("/profile/stats/:userId", authentication, authorization("user", "mentor", "admin"), getProfileStats );
router.get("/mentor/profile/stats/:mentorId", authentication, authorization("mentor"), getMentorProfileStats );
router.get("/profile/:id", authentication, getProfile);
router.put("/update", authentication, authorization("user", "mentor", "admin"), updateUser );

/* ================= NOTES ================= */

router.get("/notes", authentication, authorization("user", "mentor"), getNotes );
router.get("/mentor/notes", authentication, authorization("mentor"), getNotes );
router.post("/createNote", authentication, authorization("user"), upload.single("file"), createNotes );
router.put("/updateNote/:id", authentication, authorization("user"), updateNotes );
router.delete("/deleteNote/:id", authentication, authorization("user"), deleteNotes );
router.delete("/deleteContent/:noteId/:contentIndex", authentication, authorization("user"), deleteSingleContent );
router.get("/searchNotes", authentication, authorization("user", "mentor"), searchNotes );
router.put("/mentor/reply/:noteId/:contentId", authentication, authorization("mentor"), mentorReply );
router.get("/getMentors", authentication, authorization("user"), getMentors );
router.get("/sortByTitle", authentication, authorization("user", "mentor"), sortNotesByTitle );
router.get("/sortContents/:noteId", authentication, authorization("user"), sortContentsByText );

/* ================= ADMIN ROUTES ================= */

router.get("/admin/dashboard", authentication, authorization("admin"), getAdminStats );
router.get("/admin/users", authentication, authorization("admin"), getAllUsers );
router.get("/admin/notes", authentication, authorization("admin"), getAllNotes );
router.get("/admin/notes/:noteId", authentication, authorization("admin"), getAdminNoteById );
router.delete("/admin/delete/notes/:noteId", authentication, authorization("admin"), deleteAdminNote );
router.delete("/admin/deleteContent/:noteId/:contentIndex", authentication, authorization("admin"), deleteAdminSingleContent );

export default router;