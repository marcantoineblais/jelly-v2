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
import { faBars } from "@fortawesome/free-solid-svg-icons";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const pathname = usePathname();

  return (
    <div className="w-full bg-primary/10">
      <div className="py-4 px-2 flex gap-4 justify-between items-center">
        <div className="flex items-center justify-center">
          <Link href="/" className="flex items-center">
            <Image
              src={Logo}
              alt="Jelly"
              width={48}
              height={48}
              loading="eager"
            />
            <H1 className="mt-0 text-2xl!">Jelly</H1>
          </Link>
        </div>

        <Button
          isIconOnly
          variant="flat"
          className="bg-transparent"
          onPress={onOpen}
        >
          <FontAwesomeIcon icon={faBars} size="2x" />
        </Button>

        <Drawer isOpen={isOpen} onOpenChange={onOpenChange} placement="right">
          <DrawerContent className="bg-white/75 backdrop-blur-3xl">
            <DrawerHeader className="w-full flex justify-center text-xl">
              Navigation
            </DrawerHeader>
            <DrawerBody>
              <div className="mt-10 flex flex-col items-center gap-4">
                <Link
                  href="/"
                  className="text-primary hover:text-primary-hover underline text-lg"
                  isDisabled={pathname === "/"}
                >
                  Transfers
                </Link>

                <Link
                  href="/torrents"
                  className="text-primary hover:text-primary-hover underline text-lg"
                  isDisabled={pathname === "/torrents"}
                >
                  Torrents
                </Link>

                <Link
                  href="/downloads"
                  className="text-primary hover:text-primary-hover underline text-lg"
                  isDisabled={pathname === "/downloads"}
                >
                  Downloads
                </Link>

                <div className="mt-10">
                  <Button
                    onPress={onClose}
                    color="default"
                    variant="bordered"
                    className="border-default-foreground"
                    size="sm"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
}
