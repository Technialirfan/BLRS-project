import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import DarkModeToggle from "../shared/DarkModeToggle";

const navLinkClass = ({ isActive }) =>
  `px-1 py-1 text-sm font-medium transition ${
    isActive
      ? "border-b-2 border-[#D4AF37] text-[#D4AF37]"
      : "text-white hover:text-[#D4AF37]"
  }`;

const PublicNavbar = () => {
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 border-b border-white/20 bg-[#1B4332] dark:bg-[#0D2B1F]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#D4AF37] bg-[#2D6A4F] text-[#D4AF37]">
            *
          </div>
          <div className="hidden sm:block">
            <p className="text-xs text-slate-200">{t("landing.govtName")}</p>
            <p className="font-semibold text-white">{t("landing.systemTitle")}</p>
          </div>
        </Link>

        <div className="hidden items-center gap-5 md:flex">
          <NavLink to="/" end className={navLinkClass}>
            {t("nav.home")}
          </NavLink>
          <NavLink to="/about" className={navLinkClass}>
            {t("about.navLink")}
          </NavLink>
          <NavLink to="/contact" className={navLinkClass}>
            {t("contact.navLink")}
          </NavLink>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <DarkModeToggle />
          <Link
            to="/login"
            className="rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-[#1B4332] hover:bg-[#F0D060]"
          >
            {t("nav.login")}
          </Link>
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-white hover:bg-white/10 md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen ? (
        <div className="border-t border-white/20 px-4 py-3 md:hidden">
          <div className="space-y-2">
            <NavLink
              to="/"
              end
              className={navLinkClass}
              onClick={() => setMobileOpen(false)}
            >
              {t("nav.home")}
            </NavLink>
            <NavLink
              to="/about"
              className={navLinkClass}
              onClick={() => setMobileOpen(false)}
            >
              {t("about.navLink")}
            </NavLink>
            <NavLink
              to="/contact"
              className={navLinkClass}
              onClick={() => setMobileOpen(false)}
            >
              {t("contact.navLink")}
            </NavLink>
            <Link
              to="/login"
              className="mt-2 inline-block rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-[#1B4332]"
              onClick={() => setMobileOpen(false)}
            >
              {t("nav.login")}
            </Link>
          </div>
          <div className="mt-3 flex items-center justify-end">
            <DarkModeToggle />
          </div>
        </div>
      ) : null}
    </nav>
  );
};

export default PublicNavbar;
