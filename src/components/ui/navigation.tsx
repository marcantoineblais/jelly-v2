"use client";

import { Link } from "@heroui/react";
import H1 from "../elements/H1";
import Logo from "@/src/assets/img/logo.png";
import Image from "next/image";

export default function Navigation() {
  return (
    <div className="w-full">
      <div className="py-4 px-2 max-w-2xl mx-auto flex gap-4 justify-between items-center">
        <div className="flex items-center justify-center">
          <Link href="/" className="flex items-center">
            <Image src={Logo} alt="Jelly" width={48} height={48} loading="eager" />
            <H1 className="mt-0 text-2xl!">Jelly</H1>
          </Link>
        </div>

        <div className="flex gap-4">
          <Link
            href="/torrents"
            className="text-primary hover:text-primary-hover underline text-lg"
          >
            Torrents
          </Link>

          <Link
            href="/downloads"
            className="text-primary hover:text-primary-hover underline text-lg"
          >
            Downloads
          </Link>
        </div>
      </div>
    </div>
  );
}
