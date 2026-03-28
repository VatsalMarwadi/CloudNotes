import React, { useEffect, useState, useRef } from "react";
import Styles from "./MyProfile.module.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import CustomButton from "../components/CustomButton";
import NavBar from "../components/Navigation";
import toast from "react-hot-toast";

export default function MyProfile() {
  const [err, setErr] = useState("");
  const [data, setData] = useState({});
  const [stats, setStats] = useState({});

  const navigate = useNavigate();
  const hasLoaded = useRef(false);

  const userData = JSON.parse(localStorage.getItem("userData"));
  const token = userData?.token;
  const userId = userData?.id;

  /* =========================
      PAGE LOAD
  ========================= */
  useEffect(() => {
    // ✅ Validate session
    if (!userData || !token || !userId) {
      toast.error("Invalid session, please login again");
      navigate("/login");
      return;
    }

    if (!hasLoaded.current) {
      fetchProfile();

      // Fetch stats only for user or mentor
      if (userData?.role === "mentor") {
        fetchMentorStats();
      } else if (userData?.role === "user") {
        fetchStats();
      }

      hasLoaded.current = true;
    }
  }, []);

  /* =========================
      FETCH PROFILE
  ========================= */
  const fetchProfile = async (showToast = true) => {
    if (!token || !userId) return; // ✅ Validation

    const profilePromise = axios.get(
      `http://localhost:8000/profile/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (showToast) {
      toast.promise(profilePromise, {
        loading: "Loading profile...",
        success: (res) => {
          if (res?.data?.data) setData(res.data.data);
          return "Profile loaded successfully";
        },
        error: "Failed to load profile",
      });
    } else {
      try {
        const res = await profilePromise;
        if (res?.data?.data) setData(res.data.data);
      } catch (error) {
        setErr(error.message);
      }
    }

    return profilePromise;
  };

  /* =========================
      USER STATS
  ========================= */
  const fetchStats = async () => {
    if (!token || !userId) return; // ✅ Validation

    try {
      const res = await axios.get(
        `http://localhost:8000/profile/stats/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (res?.data?.stats) setStats(res.data.stats);
    } catch (error) {
      toast.error("Failed to load stats");
      console.log(error);
    }
  };

  /* =========================
      MENTOR STATS
  ========================= */
  const fetchMentorStats = async () => {
    if (!token || !userId) return; // ✅ Validation

    try {
      const res = await axios.get(
        `http://localhost:8000/mentor/profile/stats/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (res?.data?.stats) setStats(res.data.stats);
    } catch (error) {
      toast.error("Failed to load mentor stats");
      console.log(error);
    }
  };

  /* =========================
      LOGOUT
  ========================= */
  function logoutHandler() {
    localStorage.removeItem("userData");
    toast.success("Logged out successfully");
    navigate("/login");
  }

  /* =========================
      REFRESH DASHBOARD
  ========================= */
  const handleRefresh = async () => {
    const refreshPromise = fetchProfile(false);

    toast.promise(refreshPromise, {
      loading: "Refreshing profile...",
      success: "Profile updated",
      error: "Refresh failed",
    });

    if (userData?.role === "mentor") {
      fetchMentorStats();
    } else if (userData?.role === "user") {
      fetchStats();
    }
  };

  /* =========================
      UI
  ========================= */
  return (
    <>
      <NavBar
        login="true"
        title="My Profile Dashboard"
        userName={data?.name || ""}
        id={userId}
      />

      <div className={Styles.profileWrapper}>
        <div className={Styles.profileCard}>
          {err && <p className={Styles.err}>{err}</p>}

          <h1 className={Styles.title}>Profile</h1>

          {/* USER INFO */}
          <div className={Styles.profileInfo}>
            <p>
              <span className={Styles.label}>Name :</span> {data?.name || ""}
            </p>

            <p>
              <span className={Styles.label}>Email :</span> {data?.email || ""}
            </p>

            <p>
              <span className={Styles.label}>Role :</span> {data?.role || ""}
            </p>

            <p>
              <span className={Styles.label}>Phone :</span> {data?.phone || ""}
            </p>
          </div>

          {/* DASHBOARD (ONLY FOR USER & MENTOR) */}
          {userData?.role !== "admin" && (
            <>
              <h2 className={Styles.dashboardTitle}>
                {userData?.role === "mentor"
                  ? "Mentor Dashboard"
                  : "Your Activity"}
              </h2>

              <div className={Styles.dashboardGrid}>
                <div className={Styles.statCard}>
                  <h3>{stats?.totalNotes || 0}</h3>
                  <p>Total Notes</p>
                </div>

                <div className={Styles.statCard}>
                  <h3>{stats?.totalContents || 0}</h3>
                  <p>Total Contents</p>
                </div>

                <div className={Styles.statCard}>
                  <h3>{stats?.totalPending || 0}</h3>
                  <p>Pending Assessment</p>
                </div>

                <div className={Styles.statCard}>
                  <h3>{stats?.totalCompleted || 0}</h3>
                  <p>Completed Assessment</p>
                </div>
              </div>
            </>
          )}

          {/* BUTTONS */}
          <div className={Styles.buttonGroup}>
            <CustomButton
              btnText="Refresh"
              handler={handleRefresh}
              customStyle={Styles.btn}
            />

            <CustomButton
              btnText="LogOut"
              handler={logoutHandler}
              customStyle={Styles.btn}
            />
          </div>
        </div>
      </div>
    </>
  );
}
