# google_cases.py
import requests
from bs4 import BeautifulSoup

def search_google_cases(q, num=3):
    try:
        r=requests.get("https://www.google.com/search",
                       params={"q":q+" case law","num":num},
                       headers={"User-Agent":"Mozilla/5.0"},
                       timeout=5)
        soup=BeautifulSoup(r.text,"html.parser")
        return [h.text for h in soup.select("h3")[:num]]
    except:
        return []
