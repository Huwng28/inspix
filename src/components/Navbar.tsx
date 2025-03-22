"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { FiSearch, FiMenu, FiX, FiHome, FiUser, FiLogOut } from "react-icons/fi"; // Import icon
import { CgAddR } from "react-icons/cg";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { User } from "firebase/auth";
import { MdOutlineExplore } from "react-icons/md";


// Danh sách gợi ý có sẵn
const fixedSuggestions = [
  "cat", "dog", "capybara", "rabbit", "fox", "panda", "lion",
  "nature", "forest", "mountains", "ocean", "river", "desert",
  "city", "skyscraper", "street", "night lights", "architecture",
  "food", "pizza", "sushi", "coffee", "burger", "wine",
  "technology", "robot", "AI", "cyberpunk", "space", "galaxy",
  "cars", "motorcycle", "race car", "airplane", "train",
  "abstract", "minimalist", "calligraphy", "anime", "fantasy",
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false); // Trạng thái mở menu trên mobile  
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (pathname === "/") {
      setSearchQuery("");
    }
  }, [pathname]);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  const filterSuggestions = (query: string) => {
    if (!query) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const filtered = fixedSuggestions.filter((suggestion) =>
      suggestion.toLowerCase().includes(query.toLowerCase())
    );

    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    filterSuggestions(value);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    router.push(`/search?q=${encodeURIComponent(suggestion)}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() !== "") {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setShowSuggestions(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setShowSuggestions(false);
  };

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
    router.push("/");
  };

  return (
    <nav className="fixed top-0 left-0 w-full bg-white shadow-md py-2 px-4 flex justify-between items-center z-50">

      {/* ✅ Logo */}
      <Link href="/" className="text-2xl font-bold text-blue-500">
        Inspix
      </Link>

      {/* ✅ Search Bar */}
      <div className="hidden md:flex relative flex-1 mx-4 max-w-xl">
        <form onSubmit={handleSearch} className="relative w-full">
          <input
            type="text"
            placeholder="Tìm kiếm ảnh..."
            value={searchQuery}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-full outline-none px-4 pr-10 focus:ring-2 focus:ring-blue-300"
          />

          {/* Nút xóa */}
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white bg-gray-400 hover:bg-black rounded-full w-4 h-4 text-xs flex items-center justify-center"
            >
              Ⅹ
            </button>
          )}

          {/* Danh sách gợi ý */}
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute left-0 mt-2 w-full bg-white border border-gray-300 rounded-md shadow-lg z-10">
              {suggestions.map((suggestion, index) => (
                <li
                  key={`${suggestion}-${index}`}
                  className="p-2 cursor-pointer hover:bg-gray-200"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <FiSearch className="inline mr-2 text-gray-500" />
                  {suggestion}
                </li>
              ))}
            </ul>
          )}
        </form>
      </div>

      {/* ✅ Menu Desktop */}
      <div className="hidden md:flex space-x-6">
        <Link href="/" className="text-gray-600 hover:text-black">
          <FiHome size={24} />
        </Link>
        <Link href="/uploaded" className="text-gray-600 hover:text-black">
          <MdOutlineExplore size={24} />
        </Link>
        <Link href="/upload" className="text-gray-600 hover:text-black">
          <CgAddR size={24} />
        </Link>
        <Link href="/personal" className="text-gray-600 hover:text-black">
          <FiUser size={24} />
        </Link>

        {user && (
          <button onClick={handleLogout} className="text-gray-600 hover:text-black">
            <FiLogOut size={24} />
          </button>
        )}
      </div>


      {/* ✅ Hamburger Menu trên mobile */}
      <button className="md:hidden text-gray-600 text-2xl" onClick={toggleMenu}>
        {menuOpen ? <FiX /> : <FiMenu />}
      </button>


      {/* ✅ Menu Mobile */}
      {menuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={toggleMenu} />
      )}

      <div
        className={`fixed top-0 right-0 h-full w-64 bg-white shadow-lg z-50 transform ${menuOpen ? "translate-x-0" : "translate-x-full"
          } transition-transform`}
      >
        <button className="absolute top-4 right-4 text-2xl" onClick={toggleMenu}>
          <FiX />
        </button>

        <ul className="mt-16 space-y-4 p-4">
          <li>
            <Link
              href="/"
              className="flex items-center space-x-2 text-lg  hover:text-red-500 w-full"
              onClick={toggleMenu}
            >
              <FiHome size={24} />
              <span>Trang chủ</span>
            </Link>
          </li>
          <li>
            <Link
              href="/personal"
              className="flex items-center space-x-2 text-lg  hover:text-red-500 w-full"
              onClick={toggleMenu}
            >
              <FiUser size={24} />
              <span>
                Cá nhân
              </span>
            </Link>
          </li>
          {user && (
            <li>
              <button
                onClick={() => {
                  handleLogout();
                  toggleMenu();
                }}
                className="flex items-center space-x-2 text-lg  hover:text-red-500 w-full"
              >
                <FiLogOut size={24} />
                <span>Đăng xuất</span>
              </button>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
}

