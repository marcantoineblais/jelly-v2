const H2 = ({
  className = "",
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <h2
      className={`w-full text-center text-3xl font-bold ${className}`}
    >
      {children}
    </h2>
  );
};

export default H2;
