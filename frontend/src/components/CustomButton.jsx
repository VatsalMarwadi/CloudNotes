import React from "react";
import Styles from "./CustomButton.module.css";

export default function CustomButton({
  btnText = "Submit",
  customStyle = "",
  handler = () => {},
}) {
  return (
    <div>
      <button
        className={`${Styles.defaultStyle} ${customStyle}`}
        onClick={handler}
      >
        {btnText || "Submit"}
      </button>
    </div>
  );
}