import { useEffect, useState } from "react";
import NewsBlock from "./NewsBlock";

type NewsItem = {
  title: string;
  content: string;
  link: string;
  sentiment: string;
  reason: string;
  published: string;
  symbol: string;
  _id: string;
};

export default function SentimentNews() {
  const [news, setNews] = useState<NewsItem[]>([]);
  useEffect(() => {
    const fetchNews = async () => {
      const response = await fetch(
        new URL("sentiment/", "http://localhost:5000/")
      );

      if (!response.ok) {
        console.error("Failed to fetch news");
        return;
      }

      const data = await response.json();
      console.log("Fetched news:", data);
      setNews(data);
    };

    fetchNews();
  }, []);
  return (
    <div className="row-start-1 w-full max-w-[30rem] h-auto flex flex-col gap-4">
      {news.length ? (
        news.map((item) => (
          <NewsBlock
            coin={item.symbol}
            title={item.title}
            content={item.content}
            link={item.link}
            sentiment={item.sentiment}
            uploadDate={item.published}
            reason={item.reason}
            key={item._id}
          />
        ))
      ) : (
        <div>Loading news...</div>
      )}
    </div>
  );
}
