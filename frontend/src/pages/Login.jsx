import React, { useState } from "react";
import Styles from "./Login.module.css";
import CustomButton from "../components/CustomButton";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handlerSubmit = async (e) => {
    e.preventDefault();

    // =====================
    // VALIDATIONS
    // =====================
    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }
    if (!password.trim()) {
      toast.error("Please enter your password");
      return;
    }

    // =====================
    // LOGIN REQUEST
    // =====================
    const loginPromise = axios.post(
      "http://localhost:8000/login",
      { email, password },
      { headers: { "Content-Type": "application/json" } },
    );

    toast.promise(loginPromise, {
      loading: "Logging in...",
      success: "Login successful 🚀",
      error: "Login failed! Please check your credentials",
    });

    try {
      const res = await loginPromise;

      if (res.status === 200 && res.data?.data) {
        const userData = res.data.data;
        localStorage.setItem("userData", JSON.stringify(userData));

        setTimeout(() => {
          if (userData.role === "admin") navigate("/admin");
          else if (userData.role === "mentor") navigate("/mentor-dashboard");
          else navigate("/");
        }, 1000);
      } else {
        toast.error("Invalid credentials");
      }
    } catch (error) {
      console.error(error);
      toast.error("Login failed! Please try again");
    }
  };

  return (
    <div className={Styles.login}>
      <h1 className={Styles.title}>Login To Continue</h1>

      <form className={Styles.form} onSubmit={handlerSubmit}>
        <input
          type="email"
          placeholder="Email"
          className={Styles.inputField}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className={Styles.inputField}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <CustomButton btnText="Login" handler={handlerSubmit} />
      </form>

      <p className={Styles.registerText}>
        Don't have an account? <Link to="/register">Create one here</Link>
      </p>
    </div>
  );
}