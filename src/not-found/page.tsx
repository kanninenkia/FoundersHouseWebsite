import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./page.css";
import "../components/layout/FullScreenMenu.css";

const NAV_ITEMS = [
  { label: "MAP", path: "/" },
  { label: "HOME", path: "/home" },
  { label: "ABOUT", path: "/about" },
  { label: "EVENTS", path: "/events" },
  { label: "JOIN", path: "/join" },
];
const SOCIAL_LINKS = [
  {
    label: "LINKEDIN",
    href: "https://www.linkedin.com/company/founders-house-helsinki/about/",
  },
  {
    label: "INSTAGRAM",
    href: "https://www.instagram.com/foundershousehelsinki/",
  },
];

export default function NotFoundPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, []);

  return (
    <div className="not-found-page">
      <div className="not-found-image-pane">
        <img
          src="/assets/images/team/camilla-metro.webp"
          alt="Camilla on the metro"
          className="not-found-image"
          draggable={false}
        />
        <div className="not-found-image-overlay" />
      </div>

      <div className="not-found-content-pane">
        <div className="not-found-copy">
          <p className="not-found-eyebrow">404: WE COULDN'T FIND WHAT YOU ARE LOOKING FOR</p>
          <p className="not-found-subtitle">TRY ONE OF OUR OTHER PAGES:</p>
        </div>

        <nav className="menu-nav not-found-nav" aria-label="Primary">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="menu-nav-item"
              type="button"
            >
              <span className="menu-nav-item-text">
                {item.label.split("").map((letter, i) => (
                  <span key={`${item.path}-${i}`} className="char" style={{ transitionDelay: `${i * 0.03}s` }}>
                    <span className="char-original">{letter}</span>
                    <span className="char-clone">{letter}</span>
                  </span>
                ))}
              </span>
            </button>
          ))}
        </nav>

        <div className="not-found-footer">
          {SOCIAL_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="menu-social-link"
            >
              {item.label.split("").map((letter, i) => (
                <span key={`${item.label}-${i}`} className="char-small" style={{ transitionDelay: `${i * 0.02}s` }}>
                  <span className="char-original-small">{letter}</span>
                  <span className="char-clone-small">{letter}</span>
                </span>
              ))}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
