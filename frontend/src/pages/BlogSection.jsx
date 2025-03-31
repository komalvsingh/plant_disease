import React, { useEffect, useState } from "react";
import axios from "axios";

const BlogSection = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const articleUrls = new Set(); // Set to track unique URLs

  useEffect(() => {
    const fetchData = async () => {
      try {
        const query = `"plant disease" OR "crop disease" OR "plant health" OR "crop health" OR "agriculture technology" OR "sustainable farming" OR "pesticides" OR "soil health" OR "organic farming"`;

        const response = await axios.get(
          `https://newsapi.org/v2/everything?q=${query}&language=en&sortBy=publishedAt&pageSize=50&page=${page}&apiKey=${
            import.meta.env.VITE_NEWS_API_KEY
          }`
        );

        const data = response.data.articles;

        if (data.length === 0) {
          setHasMore(false);
          return;
        }

        // Check if image URLs are accessible
        const checkImage = async (url) => {
          try {
            const res = await fetch(url, { method: "HEAD" });
            return res.ok;
          } catch {
            return false;
          }
        };

        const filteredBlogs = await Promise.all(
          data
            .filter(
              (item) =>
                item.urlToImage &&
                item.description &&
                !articleUrls.has(item.url) // Ensure uniqueness
            )
            .map(async (item) => {
              const isValidImage = await checkImage(item.urlToImage);
              if (!isValidImage) return null;
              articleUrls.add(item.url); // Mark URL as seen
              return {
                title: item.title,
                content: item.description,
                imageUrl: item.urlToImage,
                url: item.url,
              };
            })
        );

        setArticles((prev) => [...prev, ...filteredBlogs.filter(Boolean)]);
      } catch (err) {
        setError("Failed to fetch articles.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [page]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const loadMore = () => {
    if (hasMore) {
      setPage((prev) => prev + 1);
    }
  };

  const filteredArticles = articles.filter((article) =>
    article.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold text-center mb-4">Plant & Crop News</h1>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search blogs..."
          value={searchTerm}
          onChange={handleSearch}
          className="border rounded p-2 w-full"
        />
      </div>

      {loading && <p>Loading articles...</p>}
      {error && <p>{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredArticles.map((article, index) => (
          <div key={index} className="border rounded-lg p-4 shadow-lg">
            {article.imageUrl && (
              <img
                src={article.imageUrl}
                alt={article.title}
                className="w-full h-40 object-cover rounded"
                onError={(e) => (e.target.style.display = "none")}
              />
            )}
            <h2 className="text-xl font-semibold mt-2">{article.title}</h2>
            <p className="text-base md:text-lg text-gray-500 whitespace-pre-line">
              {article.content}
            </p>
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 text-blue-500"
            >
              Read More
            </a>
          </div>
        ))}
      </div>

      {hasMore && (
        <button
          onClick={loadMore}
          className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg shadow-md block mx-auto"
        >
          Load More Blogs
        </button>
      )}
    </div>
  );
};

export default BlogSection;