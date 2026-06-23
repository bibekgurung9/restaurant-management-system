"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";  // Import useRouter from next/navigation
import { Button } from "../ui/button";
import { Search } from "lucide-react";

function SearchBar() {
  const searchParams = useSearchParams();
  const router = useRouter();  // Get the Next.js router
  const [keyword, setKeyword] = useState(searchParams?.get("keyword") || "");

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setKeyword(event.target.value);
  };

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const queryParams = new URLSearchParams(window.location.search);
    queryParams.set("keyword", keyword);  // Set the 'keyword' query parameter

    // Preserve the date parameter in the query string
    const currentDate = searchParams?.get("date");
    if (currentDate) {
      queryParams.set("date", currentDate);  // Ensure date is preserved
    }

    // Push the updated URL with the new keyword and preserved date parameters
    router.push(`?${queryParams.toString()}`);
  };

  const handleClearSearch = () => {
    setKeyword("");
    const queryParams = new URLSearchParams(window.location.search);
    queryParams.delete("keyword");  // Remove the 'keyword' query parameter

    // Preserve the date parameter in the query string
    const currentDate = searchParams?.get("date");
    if (currentDate) {
      queryParams.set("date", currentDate);  // Ensure date is preserved
    }

    // Push the updated URL with the keyword parameter removed and preserved date
    router.push(`?${queryParams.toString()}`);
  };

  useEffect(() => {
    // On component mount, update the state with the current query parameter value
    setKeyword(searchParams?.get("keyword") || "");
  }, [searchParams]);  // Dependency on searchParams to update when the URL changes

  return (
    <div className="flex items-center gap-3">
      <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={keyword}
          onChange={handleSearchChange}
          placeholder="Search..."
          className="px-3 py-2 border border-gray-300 rounded-lg"
        />
        <Button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg">
          <Search className="h-5 w-5" />
        </Button>
      </form>
      {keyword && (
        <Button
          onClick={handleClearSearch}
          className="text-red-500 hover:bg-gray-200 rounded-full p-2"
        >
          Clear
        </Button>
      )}
    </div>
  );
}

export default SearchBar;
