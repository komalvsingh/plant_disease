from flask import Flask, render_template, request
import pandas as pd
import os
import requests
from bs4 import BeautifulSoup

app = Flask(__name__)

# Load blog data from CSV or run scraper if needed
def load_blog_data():
    try:
        if os.path.exists("plant_blogs.csv"):
            df = pd.read_csv("plant_blogs.csv")
            return df.to_dict(orient="records")
        else:
            print("CSV file not found. Running scraper...")
            from scraper import scrape_plant_blogs
            return scrape_plant_blogs()
    except Exception as e:
        print(f"Error loading blog data: {e}")
        return []

# Route for home page
@app.route("/", methods=["GET"])
def home():
    query = request.args.get("search", "").lower()
    blogs = load_blog_data()
    
    if query:
        blogs = [blog for blog in blogs if 
                query in blog["Title"].lower() or 
                query in blog["Description"].lower()]
    
    return render_template("index.html", blogs=blogs, search_query=query)

# Route for blog details
@app.route("/blog-details")
def blog_details():
    blog_url = request.args.get("url")
    if not blog_url:
        return "Invalid Blog URL"
    
    # Get blog info from our data
    blogs = load_blog_data()
    blog = next((b for b in blogs if b["URL"] == blog_url), None)
    
    if not blog:
        return "Blog not found"
        
    # Let's try to fetch the actual content from the original URL
    try:
        response = requests.get(blog_url, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        })
        
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Try to extract the main content based on the page structure
            content_div = soup.find('div', class_='widget-contentparsed')
            if content_div:
                content_html = str(content_div)
            else:
                content_html = "<p>Content could not be extracted.</p>"
                
            return render_template("blog_details.html", blog=blog, content_html=content_html)
    except:
        pass
    
    # Fallback to just showing the blog info we have
    return render_template("blog_details.html", blog=blog)

if __name__ == "__main__":
    app.run(debug=True,port=5001)