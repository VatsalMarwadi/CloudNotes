import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },

    password: {
      type: String,
      required: true,
      select: false, // hide password by default
    },

    role: {
      type: String,
      enum: {
        values: ["admin", "user", "mentor"],
        message: "{admin, user, mentor} are only allowed!!",
      },
      default: "user",
      required: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("users", userSchema);