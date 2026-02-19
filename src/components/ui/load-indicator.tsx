import { Spinner } from "@heroui/react";

export default function LoadIndicator() {
  return (
    <div className="fixed inset-0 flex justify-center items-center bg-black/50 z-50">
      <Spinner color="primary" size="lg" />
    </div>
  );
}
