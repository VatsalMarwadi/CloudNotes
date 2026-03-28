import userModel from "../models/userModel.mjs";
import notesModel from "../models/notesModel.mjs";
import multer from "multer";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";
import { cloudName, cloudApiKey, cloudApiSecret } from "../../config.mjs";

/* ================= CLOUDINARY CONFIG ================= */

cloudinary.config({
  cloud_name: cloudName,
  api_key: cloudApiKey,
  api_secret: cloudApiSecret,
});

/* ================= MULTER MEMORY STORAGE ================= */

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

/* ================= GET NOTES ================= */

const getNotes = async (req, res) => {
  try {
    const { id, role } = req.user;

    let notes;

    if (role === "mentor") {
      const mentorNotes = await notesModel
        .find({ "contents.mentor": id })
        .populate("user", "name email")
        .populate("contents.mentor", "name email");

      notes = mentorNotes.map((note) => {
        const filteredContents = note.contents.filter(
          (c) => c.mentor._id.toString() === id,
        );

        return {
          ...note.toObject(),
          contents: filteredContents,
        };
      });
    } else {
      notes = await notesModel
        .find({ user: id })
        .populate("contents.mentor", "name email");
    }

    res.status(200).json({ success: true, notes });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= CREATE NOTE ================= */

const createNotes = async (req, res) => {
  try {
    let { title, content, mentorId } = req.body;
    const userId = req.user.id;

    if (!title || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    title = title.trim().toLowerCase();

    if (!mentorId) {
      return res.status(400).json({
        success: false,
        message: "Mentor ID is required",
      });
    }

    const allowedTypes = ["image/png", "image/jpeg", "application/pdf"];

    if (req.file && !allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: "Unsupported file type",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(mentorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Mentor ID",
      });
    }

    const mentorExists = await userModel.findOne({
      _id: mentorId,
      role: "mentor",
    });

    if (!mentorExists) {
      return res.status(400).json({
        success: false,
        message: "Selected mentor does not exist",
      });
    }

    let uploadedFile = null;

    if (req.file) {
      uploadedFile = await new Promise((resolve, reject) => {
        const fileNameWithoutExt = req.file.originalname
          .split(".")
          .slice(0, -1)
          .join(".");
        const uniquePublicId = `${fileNameWithoutExt}_${Date.now()}`;

        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "notes_files",
            resource_type: "raw",
            public_id: uniquePublicId,
            use_filename: true,
            unique_filename: false,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          },
        );

        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
    }

    const newContent = {
      text: content || "",
      fileName: req.file ? req.file.originalname : "",
      filePath: uploadedFile ? uploadedFile.secure_url : "",
      fileType: uploadedFile ? uploadedFile.resource_type : "",
      publicId: uploadedFile ? uploadedFile.public_id : "",
      mentor: mentorId,
      status: "pending",
    };

    let existingNote = await notesModel.findOne({
      title,
      user: userId,
    });

    if (existingNote) {
      existingNote.contents.push(newContent);
      await existingNote.save();

      return res.status(200).json({
        success: true,
        message: "Content added to existing note",
        note: existingNote,
      });
    }

    const note = await notesModel.create({
      title,
      user: userId,
      contents: [newContent],
    });

    return res.status(201).json({
      success: true,
      message: "New note created successfully",
      note,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================= UPDATE NOTE ================= */

const updateNotes = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title } = req.body;

    if (!title || title.trim().length === 0) {
      return res.status(400).json({
        message: "Title cannot be empty",
      });
    }

    const updatedNote = await notesModel.findOneAndUpdate(
      { _id: req.params.id, user: userId },
      { title: title.trim().toLowerCase() },
      { new: true },
    );

    if (!updatedNote) {
      return res
        .status(404)
        .json({ message: "Note not found or unauthorized" });
    }

    res.status(200).json({
      success: true,
      message: "Note updated successfully",
      notes: updatedNote,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= DELETE WHOLE NOTE ================= */

const deleteNotes = async (req, res) => {
  try {
    const userId = req.user.id;

    const note = await notesModel.findOne({
      _id: req.params.id,
      user: userId,
    });

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    await Promise.all(
      note.contents
        .filter((c) => c.publicId)
        .map((c) =>
          cloudinary.uploader.destroy(c.publicId, {
            resource_type: c.fileType || "raw",
          }),
        ),
    );

    await notesModel.deleteOne({ _id: note._id });

    res.status(200).json({
      success: true,
      message: "Note deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= DELETE SINGLE CONTENT ================= */

const deleteSingleContent = async (req, res) => {
  try {
    const { noteId, contentIndex } = req.params;
    const userId = req.user.id;

    const note = await notesModel.findOne({
      _id: noteId,
      user: userId,
    });

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    const index = parseInt(contentIndex);

    if (isNaN(index) || index < 0 || index >= note.contents.length) {
      return res.status(400).json({ message: "Invalid content index" });
    }

    const content = note.contents[index];

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

/* ================= SEARCH NOTES ================= */

const searchNotes = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const searchCondition = {
      $or: [
        { title: { $regex: query, $options: "i" } },
        { "contents.text": { $regex: query, $options: "i" } },
      ],
    };

    let filter = { ...searchCondition };

    if (req.user.role === "user") {
      filter.user = req.user.id;
    }

    if (req.user.role === "mentor") {
      filter["contents.mentor"] = req.user.id;
    }

    const notesData = await notesModel
      .find(filter)
      .populate("user", "name")
      .populate("contents.mentor", "name email");

    let notes = notesData;

    if (req.user.role === "mentor") {
      notes = notesData.map((note) => {
        const filteredContents = note.contents.filter(
          (c) => c.mentor._id.toString() === req.user.id,
        );

        return {
          ...note.toObject(),
          contents: filteredContents,
        };
      });
    }

    res.status(200).json({
      success: true,
      notes,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= MENTOR REPLY ================= */

const mentorReply = async (req, res) => {
  try {
    const { reply } = req.body;
    const { noteId, contentId } = req.params;

    if (!reply || reply.trim().length === 0) {
      return res.status(400).json({
        message: "Reply cannot be empty",
      });
    }

    const note = await notesModel.findOne({
      _id: noteId,
      "contents._id": contentId,
    });

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    const content = note.contents.id(contentId);

    if (content.mentor.toString() !== req.user.id) {
      return res.status(403).json({
        message: "You are not assigned to this content",
      });
    }

    content.mentorReply = reply;
    content.status = "completed";
    content.assessedBy = req.user.id;
    content.mentorReplyViewed = false;

    await note.save();

    res.status(200).json({
      success: true,
      message: "Assessment submitted",
      note,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProfileStats = async (req, res) => {
  try {
    const { userId } = req.params;

    // ✅ Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid User ID" });
    }

    // ✅ Use notesModel (NOT Notes)
    const notes = await notesModel.find({
      user: userId,
    });

    const totalNotes = notes.length;

    let totalContents = 0;
    let totalPending = 0;
    let totalCompleted = 0;

    notes.forEach((note) => {
      totalContents += note.contents.length;

      note.contents.forEach((content) => {
        if (content.status === "pending") totalPending++;
        if (content.status === "completed") totalCompleted++;
      });
    });

    console.log("UserId:", userId);
    console.log("Notes Found:", notes.length);

    res.status(200).json({
      success: true,
      stats: {
        totalNotes,
        totalContents,
        totalPending,
        totalCompleted,
      },
    });
  } catch (error) {
    console.log("PROFILE STATS ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

const getMentorProfileStats = async (req, res) => {
  try {
    const { mentorId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(mentorId)) {
      return res.status(400).json({ message: "Invalid Mentor ID" });
    }

    const notes = await notesModel.find({
      "contents.mentor": mentorId,
    });

    let totalNotes = 0;
    let totalContents = 0;
    let totalPending = 0;
    let totalCompleted = 0;

    notes.forEach((note) => {
      // 🔥 only count contents assigned to THIS mentor
      const mentorContents = note.contents.filter(
        (content) => content.mentor.toString() === mentorId,
      );

      if (mentorContents.length > 0) {
        totalNotes++; // count the note only once
      }

      mentorContents.forEach((content) => {
        totalContents++;

        if (content.status === "pending") totalPending++;
        if (content.status === "completed") totalCompleted++;
      });
    });

    res.status(200).json({
      success: true,
      stats: {
        totalNotes,
        totalContents,
        totalPending,
        totalCompleted,
      },
    });
  } catch (error) {
    console.log("MENTOR PROFILE STATS ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

const getMentors = async (req, res) => {
  try {
    const mentors = await userModel
      .find({ role: "mentor" })
      .select("_id name email"); // send only required fields

    res.status(200).json(mentors);
  } catch (error) {
    console.log("GET MENTORS ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

const sortNotesByTitle = async (req, res) => {
  try {
    const { order = "asc" } = req.query;
    const sortOrder = order === "desc" ? -1 : 1;

    let filter = {};

    if (req.user.role !== "mentor") {
      filter.user = req.user.id;
    } else {
      filter["contents.mentor"] = req.user.id;
    }

    const notes = await notesModel
      .find(filter)
      .sort({ title: sortOrder })
      .populate("contents.mentor", "name email");

    res.status(200).json({
      success: true,
      notes,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const sortContentsByText = async (req, res) => {
  try {
    const { noteId } = req.params;
    const { order = "asc" } = req.query;
    const sortOrder = order === "desc" ? -1 : 1;

    const note = await notesModel
      .findOne({
        _id: noteId,
        user: req.user.id,
      })
      .populate("contents.mentor", "name email");

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    // 🔥 Sort ONLY contents array
    note.contents.sort((a, b) => {
      if (!a.text) return -1;
      if (!b.text) return 1;

      return sortOrder === 1
        ? a.text.localeCompare(b.text)
        : b.text.localeCompare(a.text);
    });

    res.status(200).json({
      success: true,
      note,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export {
  getNotes,
  createNotes,
  updateNotes,
  deleteNotes,
  deleteSingleContent,
  searchNotes,
  mentorReply,
  getProfileStats,
  getMentorProfileStats,
  getMentors,
  sortNotesByTitle,
  sortContentsByText,
};