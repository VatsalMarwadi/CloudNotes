import userModel from "../models/userModel.mjs";
import notesModel from "../models/notesModel.mjs";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";

/* ================= GET ALL USERS ================= */

const getAllUsers = async (req, res) => {
  try {
    const users = await userModel
      .find()
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      total: users.length,
      users,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= GET ALL NOTES ================= */

const getAllNotes = async (req, res) => {
  try {
    const notes = await notesModel
      .find()
      .populate("user", "name email")
      .populate("contents.mentor", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      total: notes.length,
      notes,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= DASHBOARD STATS ================= */

const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await userModel.countDocuments({ role: "user" });
    const totalMentors = await userModel.countDocuments({ role: "mentor" });
    const totalAdmins = await userModel.countDocuments({ role: "admin" });

    const totalNotes = await notesModel.countDocuments();

    const pendingNotes = await notesModel.countDocuments({
      "contents.status": "pending",
    });

    const completedNotes = await notesModel.countDocuments({
      "contents.status": "completed",
    });

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalMentors,
        totalAdmins,
        totalNotes,
        pendingNotes,
        completedNotes,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= DELETE USER ================= */

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ ObjectId validation
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const user = await userModel.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= GET NOTE BY ID ================= */

const getAdminNoteById = async (req, res) => {
  try {
    const { noteId } = req.params;

    // ✅ ObjectId validation
    if (!mongoose.Types.ObjectId.isValid(noteId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid note ID",
      });
    }

    const note = await notesModel
      .findById(noteId)
      .populate("user", "name email")
      .populate("contents.mentor", "name email");

    if (!note)
      return res
        .status(404)
        .json({ success: false, message: "Note not found" });

    res.status(200).json(note);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= DELETE NOTE ================= */

const deleteAdminNote = async (req, res) => {
  try {
    const { noteId } = req.params;

    // ✅ ObjectId validation
    if (!mongoose.Types.ObjectId.isValid(noteId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid note ID",
      });
    }

    const note = await notesModel.findByIdAndDelete(noteId);

    if (!note)
      return res
        .status(404)
        .json({ success: false, message: "Note not found" });

    res
      .status(200)
      .json({ success: true, message: "Note deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= DELETE SINGLE CONTENT ================= */

const deleteAdminSingleContent = async (req, res) => {
  try {
    const { noteId, contentIndex } = req.params;

    // ✅ NoteId validation
    if (!mongoose.Types.ObjectId.isValid(noteId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid note ID",
      });
    }

    const note = await notesModel.findById(noteId);

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    const index = parseInt(contentIndex);

    // ✅ Content index validation
    if (isNaN(index) || index < 0 || index >= note.contents.length) {
      return res.status(400).json({ message: "Invalid content index" });
    }

    const content = note.contents[index];

    // Delete file from Cloudinary
    if (content.publicId) {
      await cloudinary.uploader.destroy(content.publicId, {
        resource_type: content.fileType || "image",
      });
    }

    note.contents.splice(index, 1);
    await note.save();

    res.status(200).json({
      success: true,
      message: "Content deleted successfully",
      note,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export {
  getAllUsers,
  getAllNotes,
  getAdminStats,
  deleteUser,
  getAdminNoteById,
  deleteAdminNote,
  deleteAdminSingleContent,
};