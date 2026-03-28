import React, { useEffect, useState } from "react";
import axios from "axios";
import Navigation from "../components/Navigation";
import Styles from "./AdminDashboard.module.css";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function AdminDashboard() {
  const [username, setUsername] = useState("");
  const [id, setId] = useState("");
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalNotes: 0,
    totalMentors: 0,
  });

  const [activeTab, setActiveTab] = useState("users");

  const tabs = [
    {
      key: "users",
      label: "Users",
      value: stats.totalUsers || 0,
      path: "/admin/users",
    },
    {
      key: "notes",
      label: "Notes",
      value: stats.totalNotes || 0,
      path: "/admin/notes",
    },
    {
      key: "mentors",
      label: "Mentors",
      value: stats.totalMentors || 0,
      path: "/admin/mentors",
    },
  ];

  const fetchStats = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem("userData") || "{}");

      if (!userData?.token) {
        toast.error("Authentication token missing. Please login again.", {
          id: "token-error",
        });
        return;
      }

      const res = await axios.get("http://localhost:8000/admin/dashboard", {
        headers: {
          Authorization: `Bearer ${userData.token}`,
        },
      });

      setUsername(userData.name || "");
      setId(userData.id || "");
      setStats(res.data?.stats || { totalUsers: 0, totalNotes: 0, totalMentors: 0 });

      toast.success("Dashboard loaded successfully", {
        id: "dashboard-success",
      });
    } catch (error) {
      console.error("Dashboard Error:", error);

      toast.error(
        error.response?.data?.message || "Failed to load dashboard statistics",
        {
          id: "dashboard-error",
        },
      );
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const barData = [
    { name: "Users", value: stats.totalUsers || 0 },
    { name: "Notes", value: stats.totalNotes || 0 },
    { name: "Mentors", value: stats.totalMentors || 0 },
  ];

  const pieData = [
    { name: "Users", value: stats.totalUsers || 0 },
    { name: "Notes", value: stats.totalNotes || 0 },
    { name: "Mentors", value: stats.totalMentors || 0 },
  ];

  const COLORS = ["#6366F1", "#22C55E", "#F59E0B"];

  return (
    <>
      <Navigation
        login="true"
        title="MyNotes For Revision"
        userName={username}
        id={id}
      />

      <div className={Styles.container}>
        <div className={Styles.cards}>
          {tabs.map((tab) => (
            <div
              key={tab.key}
              className={`${Styles.card} ${activeTab === tab.key ? Styles.active : ""}`}
              onClick={() => {
                setActiveTab(tab.key);
                navigate(tab.path);
              }}
            >
              <h3>{tab.label}</h3>
              <p>{tab.value}</p>
            </div>
          ))}
        </div>

        <div className={Styles.chartGrid}>
          <div className={Styles.chartBox}>
            <h3>Platform Statistics</h3>
            <div style={{ height: "300px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#6366F1" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={Styles.chartBox}>
            <h3>Data Distribution</h3>
            <div style={{ height: "300px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" outerRadius={100} label>
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}