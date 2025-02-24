"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Searchbar() {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() === "") return;
    router.push(`/?q=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <form onSubmit={handleSearch} className="flex items-center space-x-2 p-2 border rounded">
      <input
        type="text"
        placeholder="Tìm kiếm ảnh..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="p-2 border border-gray-300 rounded w-full"
      />
      <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
        🔍 Tìm
      </button>
    </form>
  );
}
