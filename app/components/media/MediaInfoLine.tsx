export default function MediaInfoLine({
  label = "",
  content = "",
}: {
  label?: string;
  content?: string;
}) {
  return (
    <li className="w-full pb-1.5">
      <div className="flex flex-col">
        <label className="text-sm">{label}</label>
        <article className="overflow-x-auto text-nowrap no-scrollbar">
          {content}
        </article>
      </div>
    </li>
  );
}
