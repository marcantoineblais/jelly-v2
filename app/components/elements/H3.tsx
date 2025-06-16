export default function H3({
  className = "",
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <h3 className={`w-full text-center text-xl font-bold ${className}`}>
      {children}
    </h3>
  );
}
