import userModel from "../models/userModel.mjs";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { secretToken } from "../../config.mjs";

/* ================= REGISTER USER ================= */

const registerUser = async (req, res) => {
  try {
    let { name, email, password, role, phone } = req.body;

    if (!name || name.trim().length < 3) {
      return res.status(400).send({
        status: "Failed!!",
        message: "Name must be at least 3 characters",
      });
    }

    name = name.trim();

    if (!email || !email.includes("@")) {
      return res.status(400).send({
        status: "Failed!!",
        message: "Valid email is required",
      });
    }

    email = email.trim().toLowerCase();

    if (!password || password.length < 6) {
      return res.status(400).send({
        status: "Failed!!",
        message: "Password must be at least 6 characters",
      });
    }

    if (!phone || phone.trim().length < 10) {
      return res.status(400).send({
        status: "Failed!!",
        message: "Valid phone is required",
      });
    }

    phone = phone.trim();

    const existingUser = await userModel.findOne({ email });

    if (existingUser) {
      return res.status(400).send({
        status: "Failed!!",
        message: "Email already registered",
      });
    }

    password = await bcrypt.hash(password, 10);

    const createdUser = await userModel.create({
      name,
      email,
      password,
      role: role === "mentor" ? "mentor" : "user",
      phone,
    });

    return res.status(201).send({
      status: "Ok",
      message: "User Registered Successfully!!!",
    });
  } catch (error) {
    return res.status(500).send({
      status: "Failed!!",
      message: error.message,
    });
  }
};

/* ================= LOGIN USER ================= */

const loginUser = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).send({
        status: "Failed!!",
        message: "Email and Password required",
      });
    }

    email = email.trim().toLowerCase();

    const user = await userModel.findOne({ email }).select("+password");

    if (!user) {
      return res.status(400).send({
        status: "Failed!!",
        message: "User Does Not Exist!!!",
      });
    }

    const check = await bcrypt.compare(password, user.password);

    if (!check) {
      return res.status(400).send({
        status: "Failed!!",
        message: "Invalid Credentials!!!",
      });
    }

    const token = jwt.sign({ role: user.role, id: user._id }, secretToken, {
      expiresIn: "24h",
    });

    const data = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      token,
    };

    return res.status(200).send({
      status: "Ok",
      data,
    });
  } catch (error) {
    return res.status(500).send({
      status: "Failed!!",
      message: error.message,
    });
  }
};

/* ================= UPDATE USER ================= */

const updateUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name } = req.body;

    if (!name || name.trim().length < 3) {
      return res.status(400).send({
        status: "Failed!!",
        message: "Name must be at least 3 characters",
      });
    }

    const updatedUser = await userModel
      .findByIdAndUpdate(userId, { name: name.trim() }, { new: true })
      .select("-password");

    return res.status(200).send({
      status: "Ok",
      data: updatedUser,
    });
  } catch (error) {
    return res.status(500).send({
      status: "Failed!!",
      message: error.message,
    });
  }
};

/* ================= GET PROFILE ================= */

const getProfile = async (req, res) => {
  try {
    const id = req.params.id;

    const user = await userModel.findById(id).select("-password");

    if (!user) {
      return res.status(404).send({
        status: "Failed!!",
        message: "User Not Found!!!",
      });
    }

    return res.status(200).send({
      status: "Ok",
      data: user,
    });
  } catch (error) {
    return res.status(500).send({
      status: "Failed!!",
      message: error.message,
    });
  }
};

export { registerUser, loginUser, updateUser, getProfile };