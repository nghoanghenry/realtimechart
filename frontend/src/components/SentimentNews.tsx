import { useEffect, useState } from "react";

type NewsItem = {
  title: string;
  content: string;
  link: string;
  sentiment: string;
  reason: string;
  published: string;
  coin: string;
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
    <div className="bg-white rounded-lg shadow-lg p-4 row-start-1 w-[30rem] h-[30rem] text-red-400">
      {/* {news.map((item) => item.title) || "No news available"} */}
      {news.length}
    </div>
  );
}
