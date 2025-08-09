import { Clock, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface NewsSidebarProps {
  coin: string;
  title: string;
  content: string;
  link: string;
  sentiment: string;
  uploadDate: string;
  reason: string;
}

export default function NewsBlock({
  coin,
  title,
  content,
  link,
  sentiment,
  uploadDate,
  reason,
}: NewsSidebarProps) {
  return (
    <a
      href={link}
      className="news-block rounded-lg p-2 border-gray-200 border-2"
    >
      <div className="flex flex-row-reverse w-full">
        {parseFloat(sentiment) > 0 ? (
          <TrendingUp color="green" size={18} />
        ) : parseFloat(sentiment) < 0 ? (
          <TrendingDown color="red" size={18} />
        ) : (
          <Minus color="gray" size={18} />
        )}
      </div>
      <h3 className="font-medium line-clamp-2 text-ellipsis">
        {title}
      </h3>

      <p className="text-xs text-gray-500 line-clamp-3 text-ellipsis mt-1">
        {reason}
      </p>

      <div className="extra flex justify-between align-middle pt-2">
        <span className="text-gray-500 text-xs flex items-center gap-1">
          <Clock size={14} />
          15 minutes ago
        </span>

        {coin !== "None" && (
          <span className="rounded-full px-2 border-gray-200 border-2 text-gray-500">
            {coin}
          </span>
        )}
      </div>
    </a>
  );
}
