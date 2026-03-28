import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Styles from "./Navigation.module.css";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import HomeFilledIcon from "@mui/icons-material/HomeFilled";
import MenuIcon from "@mui/icons-material/Menu";

export default function Navigation({ id = "", login = "", userName = "" }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check window width
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <nav className={Styles.nav}>
      {/* Logo */}
      <div className={Styles.logoContainer}>
        <img
          src="/logo.ico"
          alt="Cloud Notes Logo"
          className={Styles.logoImg}
        />
        <h2 className={Styles.title}>Cloud Notes</h2>
      </div>

      {/* Desktop Nav Links */}
      {!isMobile && (
        <ul className={Styles.navList}>
          <li>
            <Link to="/" className={Styles.listItem}>
              <HomeFilledIcon />
              <span>Home</span>
            </Link>
          </li>

          <li>
            <Link
              to={login ? `/profile/${id}` : "/login"}
              className={Styles.listItem}
            >
              <AccountCircleIcon />
              <span>{login ? userName : "Login"}</span>
            </Link>
          </li>
        </ul>
      )}

      {/* Mobile Hamburger */}
      {isMobile && (
        <>
          <MenuIcon
            className={Styles.menuIconMobile}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          />

          {/* Mobile Dropdown */}
          {mobileMenuOpen && (
            <div className={Styles.mobileDropdown}>
              <Link to="/" onClick={() => setMobileMenuOpen(false)}>
                <HomeFilledIcon /> Home
              </Link>
              <Link
                to={login ? `/profile/${id}` : "/login"}
                onClick={() => setMobileMenuOpen(false)}
              >
                <AccountCircleIcon /> {login ? userName : "Login"}
              </Link>
            </div>
          )}
        </>
      )}
    </nav>
  );
}
