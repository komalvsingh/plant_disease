import requests
from bs4 import BeautifulSoup
import pandas as pd
from urllib.parse import urljoin
import os

# Create directories for static files if they don't exist
if not os.path.exists('static'):
    os.makedirs('static')
if not os.path.exists('static/images'):
    os.makedirs('static/images')

# Target URL
URL = "https://www.gardeningknowhow.com/plant-problems/disease"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
}

def scrape_plant_blogs():
    print("Starting scraping process...")
    
    # Send request to the website
    response = requests.get(URL, headers=HEADERS)
    if response.status_code != 200:
        print(f"Failed to retrieve webpage. Status code: {response.status_code}")
        return []
    
    print("Page retrieved successfully!")
    
    # Parse the HTML content
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Based on the inspection images, we can see the articles are in a listing
    listing_items = soup.find_all('li', class_='listing__item')
    
    if not listing_items:
        print("No listing items found. The structure might have changed.")
        return []
    
    print(f"Found {len(listing_items)} listing items!")
    blog_data = []
    
    for index, item in enumerate(listing_items):
        try:
            # Skip sponsored posts
            if 'sponsored-post' in item.get('class', []):
                continue
                
            # Find the link and title
            link_tag = item.find('a', class_='listing__link')
            title_tag = item.find('h2', class_='listing__title')
            
            # Find the image
            img_wrapper = item.find('div', class_='listing__image-wrapper')
            img_tag = img_wrapper.find('img') if img_wrapper else None
            
            # Find the description/text
            text_tag = item.find('p', class_='listing__text listing__text--strapline')
            
            # Extract the data
            title = title_tag.text.strip() if title_tag else "No Title"
            link = link_tag['href'] if link_tag and 'href' in link_tag.attrs else "No Link"
            
            # Get the image URL - from your inspection, we can see the image is in src attribute
            img_url = ""
            if img_tag and 'src' in img_tag.attrs:
                img_url = img_tag['src']
            elif img_tag and 'data-original-mos' in img_tag.attrs:
                # Fallback to data-original-mos if src is not available
                img_url = img_tag['data-original-mos']
            else:
                img_url = "/static/images/default.jpg"
                
            description = text_tag.text.strip() if text_tag else "No Description"
            
            print(f"Processed item {index+1}: {title}")
            print(f"  Image URL: {img_url}")
            
            blog_data.append({
                "Title": title,
                "URL": link,
                "Description": description,
                "Image": img_url
            })
            
        except Exception as e:
            print(f"Error processing item {index+1}: {e}")
    
    # Save the data to CSV
    df = pd.DataFrame(blog_data)
    df.to_csv("plant_blogs.csv", index=False)
    print(f"Successfully scraped {len(blog_data)} blog posts saved to plant_blogs.csv")
    
    return blog_data

# Run the scraper if this file is executed directly
if __name__ == "__main__":
    scrape_plant_blogs()