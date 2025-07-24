from typing import Any

import feedparser
import requests
from bs4 import BeautifulSoup

from database import get_sentiment


class RSSFetcher:
    def __init__(self, sources: list[str]) -> None:
        self.sources = sources
        self.seen_urls = set(s['link'] for s in get_sentiment(limit=1024))

    def fetch_rss(self) -> list[dict[str, Any]]:
        articles = []
        for url in self.sources:
            feed = feedparser.parse(url)
            for entry in feed.entries:
                if entry.link not in self.seen_urls:
                    self.seen_urls.add(entry.link)
                    articles.append({
                        'title': entry.title,
                        'published': entry.published,
                        'link': entry.links[0].href,
                        'content': self.fetch_html(entry.links[0].href)
                    })
        return articles

    @staticmethod
    def fetch_html(url: str) -> str:
        try:
            headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
            response = requests.get(url, headers=headers, timeout=30)
            soup = BeautifulSoup(response.content, features='html.parser')

            paragraphs = soup.find_all('p')
            content = '\n'.join(p.get_text() for p in paragraphs if p.get_text())
            return content.strip()

        except Exception as e:
            print(f'[!] Failed to fetch {url}: {e}')
            return ''
