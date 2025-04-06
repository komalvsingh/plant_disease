import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Leaf } from "lucide-react";

const BlogSection = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const articleUrls = new Set(); // Set to track unique URLs
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const query = `"plant disease" OR "crop disease" OR "plant health" OR "crop health"`;

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
        setError("Failed to fetch articles.", err);
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

  const goToDashboard = () => {
    navigate("/");
  };

  const filteredArticles = articles.filter((article) =>
    article.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background farm elements - subtle and non-intrusive */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-5 left-5 opacity-10">
          <Leaf className="w-32 h-32 text-green-800" />
        </div>
        <div className="absolute top-1/3 right-10 opacity-10">
          <Leaf className="w-20 h-20 text-green-500 rotate-45" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 bg-white shadow-md relative z-10 w-full">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button 
              className="p-2 hover:bg-green-50 rounded-full"
              onClick={goToDashboard}
            >
              <ArrowLeft className="w-6 h-6 text-green-600" />
            </button>
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="ml-3 text-green-800 font-bold text-xl">Plant & Crop News</span>
                <div className="ml-3 text-xs text-green-600">Latest agriculture updates</div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto p-4 z-10 relative">
       

        <div className="mb-6 mx-4">
          <input
            type="text"
            placeholder="Search articles..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm"
          />
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="flex justify-center space-x-2 mb-4">
              <div className="w-3 h-3 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-3 h-3 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '100ms' }}></div>
              <div className="w-3 h-3 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
            </div>
            <p className="text-green-700">Loading articles...</p>
          </div>
        )}
        
        {error && <p className="text-center text-red-500 py-4 mx-4 bg-red-50 rounded-lg">{error}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mx-4">
          {filteredArticles.map((article, index) => (
            <div key={index} className="bg-white border rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
              {article.imageUrl && (
                <div className="relative">
                  <img
                    src={article.imageUrl}
                    alt={article.title}
                    className="w-full h-48 object-cover"
                    onError={(e) => (e.target.style.display = "none")}
                  />
                </div>
              )}
              <div className="p-4">
                <h2 className="text-xl font-semibold mb-2 text-green-800 line-clamp-2">{article.title}</h2>
                <p className="text-gray-600 mb-4 line-clamp-3">{article.content}</p>
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  Read More
                </a>
              </div>
            </div>
          ))}
        </div>

        {filteredArticles.length === 0 && !loading && (
          <div className="text-center py-12 mx-4">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Leaf className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-medium text-green-800 mb-2">No articles found</h3>
            <p className="text-green-600">Try changing your search terms or check back later for new content.</p>
          </div>
        )}

        {hasMore && (
          <div className="text-center mt-8 mb-6">
            <button
              onClick={loadMore}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-md transition-colors"
            >
              Load More Articles
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogSection;