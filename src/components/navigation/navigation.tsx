"use client";

import H1 from "../elements/H1";
import Logo from "@/src/assets/img/logo.png";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import useFetch from "@/src/hooks/use-fetch";
import Link from "next/link";
import Button from "../ui/Button";
import IconButton from "../ui/IconButton";

const HIDDEN_PATHS = ["/login", "/setup"];

export default function Navigation() {
  const { fetchData } = useFetch();
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetchData("/api/auth/logout", { method: "POST" });
    } finally {
      setIsOpen(false);
      router.push("/login");
      router.refresh();
    }
  }

  function handleNavigation(path: string) {
    router.push(path);
    setIsOpen(false);
  }

  if (HIDDEN_PATHS.includes(pathname)) {
    return null;
  }

  return (
    <div className="w-full bg-primary/10">
      <div className="container-main py-0.5 px-2 flex gap-4 justify-between items-center">
        <div className="basis-1/3 flex items-center">
          <Link href="/" className="flex items-center" tabIndex={-1}>
            <Image
              src={Logo}
              alt="Jelly"
              width={64}
              height={64}
              loading="eager"
            />
          </Link>
        </div>

        <div className="basis-1/3 flex items-center justify-center">
          <Link href="/" className="flex items-center" tabIndex={-1}>
            <H1 className="mt-0 text-2xl!">Jelly</H1>
          </Link>
        </div>

        <div className="basis-1/3 flex items-center justify-end">
          <IconButton
            ariaLabel="Open navigation menu"
            icon={faBars}
            size="2x"
            onClick={() => setIsOpen(true)}
          />

          <div
            className="z-40 p-8 fixed inset-y-0 right-0 max-sm:w-full w-sm translate-x-full data-open:translate-x-0 transition-transform duration-300 bg-surface-card"
            data-open={isOpen || undefined}
          >
            <h2 className="py-4 w-full flex justify-center text-xl">
              Navigation
            </h2>
            <div className="h-full flex flex-col">
              <div className="py-10 grow flex flex-col justify-between gap-12">
                <div className="flex flex-col justify-center items-center gap-4">
                  <Button
                    onClick={() => handleNavigation("/")}
                    color="primary"
                    className="w-full text-lg shadow-btn"
                    isDisabled={pathname === "/"}
                  >
                    Transfers
                  </Button>

                  <Button
                    onClick={() => handleNavigation("/downloads")}
                    color="primary"
                    className="w-full text-lg shadow-btn"
                    isDisabled={pathname === "/downloads"}
                  >
                    Downloads
                  </Button>

                  <Button
                    onClick={() => handleNavigation("/trackers")}
                    color="primary"
                    className="w-full text-lg shadow-btn"
                    isDisabled={pathname === "/trackers"}
                  >
                    Trackers
                  </Button>

                  <Button
                    onClick={() => handleNavigation("/torrents")}
                    color="primary"
                    className="w-full text-lg shadow-btn"
                    isDisabled={pathname === "/torrents"}
                  >
                    Torrents
                  </Button>
                </div>
                <div className="grow flex items-center justify-center">
                  <Button
                    onClick={() => setIsOpen(false)}
                    color="default"
                    className="w-full border-default-foreground shadow-btn"
                  >
                    Close
                  </Button>
                </div>

                <div className="mb-16 flex justify-center">
                  <Button
                    onClick={handleLogout}
                    color="warning"
                    className="w-full text-white shadow-btn"
                  >
                    <FontAwesomeIcon icon={faRightFromBracket} /> Logout
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
