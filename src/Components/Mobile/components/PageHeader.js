import React from "react";
import { Link } from "react-router-dom";
import { BsArrowLeft } from "react-icons/bs";
import "../styles/PageHeader.css";

const PageHeader = ({ title, backTo = "/", showBackButton = true }) => {
  return (
    <div className="page-header mb-4">
      {showBackButton && (
        <Link to={backTo} className="back-button">
          <BsArrowLeft size={20} />
        </Link>
      )}
      <h2 className="page-title">{title}</h2>
    </div>
  );
};

export default PageHeader; 