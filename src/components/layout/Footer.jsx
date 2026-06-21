import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();
  return (
    <footer className="mt-8 border-t border-white/10 bg-[#1B4332] px-6 py-6 text-sm text-white/80 dark:bg-[#0D2B1F]">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 md:flex-row">
        <div>
          <p className="font-semibold text-white">Balochistan Land Registry System</p>
          <p className="text-xs text-white/60">Powered by Blockchain | BLRS v2.0</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <NavLink to="/" className="hover:text-[#D4AF37]">
            {t("nav.home")}
          </NavLink>
          <NavLink to="/about" className="hover:text-[#D4AF37]">
            {t("about.navLink")}
          </NavLink>
          <NavLink to="/contact" className="hover:text-[#D4AF37]">
            {t("contact.navLink")}
          </NavLink>
          <NavLink to="/login" className="hover:text-[#D4AF37]">
            {t("nav.login")}
          </NavLink>
          <NavLink to="/search" className="hover:text-[#D4AF37]">
            Public Search
          </NavLink>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
