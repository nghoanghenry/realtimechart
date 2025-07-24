from apscheduler.schedulers.background import BackgroundScheduler

from database import save_sentiment
from service import RSSFetcher, Analyzer


class FetchScheduler:
    def __init__(self) -> None:
        self.scheduler = BackgroundScheduler()
        self.scheduler.add_job(self._fetch_job, trigger='interval', minutes=1)
        self.rss_fetcher = RSSFetcher(['https://finance.yahoo.com/news/rssindex'])
        self.analyzer = Analyzer()

    def _fetch_job(self) -> None:
        articles = self.rss_fetcher.fetch_rss()
        print(f'[✔] Found {len(articles)} new articles')
        for article in self.rss_fetcher.fetch_rss():
            print(f'[✔] Found new entry: {article['link']}')
            sentiment_result = self.analyzer.analyze(article['content'])
            if self.analyzer.check_result(sentiment_result):
                print(f'[✔] Analyzed sentiment for : {article['link']}')
                doc = {**article, **sentiment_result}
                save_sentiment(doc)
                print(f'[✔] Saved result for: {article['link']}')
            else:
                print(f'[!] Failed to analyze sentiment for : {article['link']}')

    def start(self) -> None:
        self.scheduler.start()
