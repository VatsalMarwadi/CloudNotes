import React, { useState } from "react";
import Styles from "./Login.module.css";
import CustomButton from "../components/CustomButton";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

export default function SignUp() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cpass, setCPass] = useState("");
  const [role, setRole] = useState("");
  const [phone, setPhone] = useState("");

  const handlerSubmit = async (e) => {
    e.preventDefault();

    // =====================
    // VALIDATIONS
    // =====================
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }
    if (!password) {
      toast.error("Please enter a password");
      return;
    }
    if (password !== cpass) {
      toast.error("Passwords do not match");
      return;
    }
    if (!role) {
      toast.error("Please select a role");
      return;
    }
    if (!phone.trim() || phone.length !== 10 || !/^\d+$/.test(phone)) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    const payload = { name, email, password, role, phone };

    // =====================
    // REGISTER REQUEST
    // =====================
    const registerPromise = axios.post(
      "http://localhost:8000/register",
      payload,
      { headers: { "Content-Type": "application/json" } },
    );

    toast.promise(registerPromise, {
      loading: "Registering user...",
      success: "User registered successfully 🎉",
      error: "Registration failed! Please try again",
    });

    try {
      const res = await registerPromise;

      if (res.status === 201) {
        setTimeout(() => {
          navigate("/login");
        }, 1000);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className={Styles.login}>
      <h1 className={Styles.title}>Sign Up</h1>

      <form className={Styles.form} onSubmit={handlerSubmit}>
        <input
          type="text"
          placeholder="Enter Name"
          className={Styles.inputField}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="email"
          placeholder="Enter Email"
          className={Styles.inputField}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Enter Password"
          className={Styles.inputField}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="Confirm Password"
          className={Styles.inputField}
          value={cpass}
          onChange={(e) => setCPass(e.target.value)}
        />

        <select
          className={Styles.select}
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="">-- Select Role --</option>
          <option value="user">User</option>
          <option value="mentor">Mentor</option>
          <option value="admin">Admin</option>
        </select>

        <input
          type="text"
          placeholder="Enter Phone Number"
          className={Styles.inputField}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <CustomButton btnText="Register" handler={handlerSubmit} />
      </form>

      <p className={Styles.registerText}>
        Already have an account? <Link to="/login">Login here</Link>
      </p>
    </div>
  );
}