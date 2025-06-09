import { pressStart2p } from "@/app/layout";

const H1 = ({
  className = "",
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <h1
      className={`w-full text-center text-5xl ${pressStart2p.className} text-gradient ${className}`}
    >
      {children}
    </h1>
  );
};

export default H1;
