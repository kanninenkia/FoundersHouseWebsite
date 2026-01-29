import React from "react";
import "./Button.css";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
  className?: string;
  disableOverlayAnimation?: boolean;
}


const renderAnimatedText = (text: React.ReactNode, disableAnimation: boolean) => {
  if (typeof text !== "string") return text;
  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      {text.split("").map((letter, i) => {
        const displayChar = letter === " " ? "\u00A0" : letter;
        return (
          <span
            key={i}
            className="char"
            style={{ position: "relative", display: "inline-block", transitionDelay: `${i * 0.02}s` }}
          >
            <span className="char-original">{displayChar}</span>
            {!disableAnimation && <span className="char-clone">{displayChar}</span>}
          </span>
        );
      })}
    </span>
  );
};

const Button: React.FC<ButtonProps> = ({ children, onClick, style, className, disableOverlayAnimation }) => {
  const shouldDisableOverlay = disableOverlayAnimation ?? (typeof window !== "undefined" && window.innerWidth <= 1280);
  return (
    <button
      className={`custom-btn${className ? ` ${className}` : ""}`}
      onClick={onClick}
      data-disable-overlay={shouldDisableOverlay ? "true" : undefined}
      style={style}
    >
      <span className="custom-btn-bg" />
      <span className="custom-btn-content">
        <div className="btn-content-inner">
            {renderAnimatedText(children, shouldDisableOverlay)}
        </div>
    </span>
    </button>
  );
};

export default Button;
