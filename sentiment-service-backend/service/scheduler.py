import datetime
from apscheduler.schedulers.background import BackgroundScheduler

from database import save_sentiment
from service import RSSFetcher, Analyzer


class FetchScheduler:
    def __init__(self) -> None:
        self.scheduler = BackgroundScheduler()
        self.rss_fetcher = RSSFetcher(
            [
                "https://www.reddit.com/r/CryptoCurrency.rss",
                "https://finance.yahoo.com/news/rssindex",
                "https://www.reddit.com/r/Bitcoin.rss",
                "https://www.reddit.com/r/ethereum.rss",
            ]
        )
        self.analyzer = Analyzer()
        run_time = datetime.datetime.now() + datetime.timedelta(seconds=4)
        self.scheduler.add_job(self._fetch_job, trigger="date", run_date=run_time)
        self.scheduler.add_job(self._fetch_job, trigger="interval", seconds=3600)

    def _fetch_job(self) -> None:
        articles = self.rss_fetcher.fetch_rss()
        print(f"[*] Found {len(articles)} new articles")
        for article in articles:
            print(f"[*] Found new entry: {article['link']}")
            sentiment_result = self.analyzer.analyze(article["content"])
            if self.analyzer.check_result(sentiment_result):
                print(f"[✔] Analyzed sentiment for : {article['link']}")
                doc = {**article, **sentiment_result}
                save_sentiment(doc)
                print(f"[✔] Saved result for: {article['link']}")
            else:
                print(f"[!] Failed to analyze sentiment for : {article['link']}")

    def start(self) -> None:
        self.scheduler.start()
