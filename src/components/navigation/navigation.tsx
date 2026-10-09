"use client";

import Logo from "@/src/assets/img/logo.png";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRightArrowLeft,
  faMagnifyingGlass,
  faRightFromBracket,
  faSatelliteDish,
  faCloudArrowDown,
  type IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { twJoin } from "tailwind-merge";
import useFetch from "@/src/hooks/use-fetch";
import useModal from "@/src/hooks/useModal";
import Button from "../ui/Button";
import IconButton from "../ui/IconButton";
import Modal from "../Modal";

const HIDDEN_PATHS = ["/login", "/setup"];

type NavItem = { href: string; label: string; icon: IconDefinition };

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Transfers", icon: faArrowRightArrowLeft },
  { href: "/downloads", label: "Search", icon: faMagnifyingGlass },
  { href: "/trackers", label: "Trackers", icon: faSatelliteDish },
  { href: "/torrents", label: "Torrents", icon: faCloudArrowDown },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Navigation() {
  const { fetchData } = useFetch();
  const logoutModal = useModal();
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetchData("/api/auth/logout", { method: "POST" });
    } finally {
      logoutModal.onClose();
      router.push("/login");
      router.refresh();
    }
  }

  if (HIDDEN_PATHS.includes(pathname)) {
    return null;
  }

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border/70 glass">
        <div className="container-main h-14 px-4 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-2.5 shrink-0 group"
            tabIndex={-1}
          >
            <span className="relative size-9 rounded-xl overflow-hidden ring-1 ring-white/10 bg-surface-elevated transition-transform duration-300 group-hover:scale-105">
              <Image
                src={Logo}
                alt="Jelly"
                fill
                sizes="36px"
                className="object-cover"
                loading="eager"
              />
            </span>
            <span className="text-lg font-semibold tracking-tight">Jelly</span>
          </Link>

          {/* Desktop tabs */}
          <nav className="hidden sm:flex items-center gap-1 rounded-full bg-surface-card/80 border border-border p-1">
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={twJoin(
                    "relative px-3.5 h-8 flex items-center gap-2 rounded-full text-sm font-medium transition-colors duration-200",
                    active
                      ? "text-primary-foreground"
                      : "text-text-muted hover:text-text",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full bg-primary shadow-glow"
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 38,
                      }}
                    />
                  )}
                  <FontAwesomeIcon
                    icon={item.icon}
                    className="relative text-xs"
                  />
                  <span className="relative">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <IconButton
            ariaLabel="Logout"
            icon={faRightFromBracket}
            onClick={logoutModal.onOpen}
            className="size-9 rounded-full flex items-center justify-center hover:bg-surface-hover"
          />
        </div>
      </header>

      <Modal
        title="Log out"
        isOpen={logoutModal.isOpen}
        onClose={logoutModal.onClose}
        closeOnOutsideClick
        footer={
          <>
            <Button
              onClick={logoutModal.onClose}
              color="default"
              className="w-28"
            >
              Cancel
            </Button>
            <Button onClick={handleLogout} color="warning" className="w-28">
              Log out
            </Button>
          </>
        }
      >
        <p className="text-text-secondary">Are you sure you want to log out?</p>
      </Modal>
    </>
  );
}

/** Bottom tab bar, shown on small screens only. */
export function MobileTabBar() {
  const pathname = usePathname();

  if (HIDDEN_PATHS.includes(pathname)) {
    return null;
  }

  return (
    <nav className="sm:hidden shrink-0 border-t border-border/70 glass pb-[env(safe-area-inset-bottom)]">
      <ul className="grid grid-cols-4">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={twJoin(
                  "relative h-16 flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors duration-200",
                  active ? "text-primary" : "text-text-muted",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="tab-indicator"
                    className="absolute top-0 h-0.5 w-10 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 500, damping: 38 }}
                  />
                )}
                <motion.span
                  animate={{ scale: active ? 1.12 : 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <FontAwesomeIcon icon={item.icon} className="text-base" />
                </motion.span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
