import mongoose from "mongoose";

const notesSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },

    contents: [
      {
        text: {
          type: String,
          default: "",
          trim: true,
        },

        fileName: {
          type: String,
          default: "",
        },

        filePath: {
          type: String,
          default: "",
        },

        fileType: {
          type: String,
          default: "",
        },

        publicId: {
          type: String,
          default: "",
        },

        mentor: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "users",
          required: true,
          index: true,
        },

        mentorReply: {
          type: String,
          default: "",
          trim: true,
        },

        assessedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "users",
        },

        status: {
          type: String,
          enum: ["pending", "completed"],
          default: "pending",
        },
      },
    ],
  },
  { timestamps: true },
);

export default mongoose.model("Notes", notesSchema);