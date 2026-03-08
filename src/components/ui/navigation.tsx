"use client";

import {
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  Link,
  useDisclosure,
} from "@heroui/react";
import H1 from "../elements/H1";
import Logo from "@/src/assets/img/logo.png";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import { usePathname, useRouter } from "next/navigation";
import useFetch from "@/src/hooks/use-fetch";

const HIDDEN_PATHS = ["/login", "/setup"];

export default function Navigation() {
  const { fetchData } = useFetch();
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetchData("/api/auth/logout", { method: "POST" });
    } finally {
      onClose();
      router.push("/login");
      router.refresh();
    }
  }

  function handleNavigation(path: string) {
    router.push(path);
    onClose();
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
          <Button
            isIconOnly
            variant="flat"
            className="bg-transparent"
            onPress={onOpen}
          >
            <FontAwesomeIcon icon={faBars} className="text-4xl" />
          </Button>

          <Drawer isOpen={isOpen} onOpenChange={onOpenChange} placement="right">
            <DrawerContent className="bg-white backdrop-blur-3xl">
              <DrawerHeader className="w-full flex justify-center text-xl">
                Navigation
              </DrawerHeader>
              <DrawerBody className="py-10 flex flex-col justify-between">
                <div className="grow flex flex-col justify-center items-center gap-4">
                  <Button
                    href="/"
                    onPress={() => handleNavigation("/")}
                    variant="solid"
                    color="primary"
                    className="w-full text-lg shadow-btn"
                    size="md"
                    isDisabled={pathname === "/"}
                  >
                    Transfers
                  </Button>

                  <Button
                    href="/downloads"
                    onPress={() => handleNavigation("/downloads")}
                    variant="solid"
                    color="primary"
                    className="w-full text-lg shadow-btn"
                    size="md"
                    isDisabled={pathname === "/downloads"}
                  >
                    Downloads
                  </Button>

                  <Button
                    href="/trackers"
                    onPress={() => handleNavigation("/trackers")}
                    variant="solid"
                    color="primary"
                    className="w-full text-lg shadow-btn"
                    size="md"
                    isDisabled={pathname === "/trackers"}
                  >
                    Trackers
                  </Button>

                  <Button
                    href="/torrents"
                    onPress={() => handleNavigation("/torrents")}
                    variant="solid"
                    color="primary"
                    className="w-full text-lg shadow-btn"
                    size="md"
                    isDisabled={pathname === "/torrents"}
                  >
                    Torrents
                  </Button>
                </div>
                <div className="grow flex justify-center">
                  <Button
                    onPress={onClose}
                    color="default"
                    variant="bordered"
                    className="w-full border-default-foreground shadow-btn"
                    size="md"
                  >
                    Close
                  </Button>
                </div>
                <div className="flex justify-center">
                  <Button
                    onPress={handleLogout}
                    color="warning"
                    variant="solid"
                    className="w-full text-white shadow-btn"
                    startContent={<FontAwesomeIcon icon={faRightFromBracket} />}
                    size="md"
                  >
                    Logout
                  </Button>
                </div>
              </DrawerBody>
            </DrawerContent>
          </Drawer>
        </div>
      </div>
    </div>
  );
}
