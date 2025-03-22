"use client"; // Đảm bảo code này chỉ chạy trên client-side

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation"; // Hook lấy tham số từ URL
import { Suspense } from "react"; // Thêm Suspense để bao bọc useSearchParams
import MasonryGrid from "@/components/MasonryGrid"; // Component hiển thị ảnh dạng lưới
import ImageModal from "@/components/ImageModal"; // Component hiển thị ảnh trong modal

interface ImageData {
  id: string;
  src: string;
  fullSrc: string;
  alt: string;
}

// Component nội bộ sử dụng useSearchParams
function SearchPageContent() {
  const [images, setImages] = useState<ImageData[]>([]); // State chứa danh sách ảnh tìm kiếm
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null); // State chứa ảnh được chọn
  const searchParams = useSearchParams(); // Lấy các tham số từ URL
  const query = searchParams.get("q") || ""; // Lấy giá trị từ khóa tìm kiếm từ tham số `q`

  const API_KEY = process.env.NEXT_PUBLIC_UNSPLASH_API_KEY; // Lấy API Key từ biến môi trường

  // Fetch ảnh từ Unsplash API khi `query` thay đổi
  useEffect(() => {
    if (!query) return; // Nếu không có từ khóa tìm kiếm thì không làm gì

    const fetchSearchResults = async () => {
      try {
        const res = await fetch(
          `https://api.unsplash.com/search/photos?page=1&per_page=20&query=${encodeURIComponent(
            query
          )}&client_id=${API_KEY}` // Gọi API Unsplash với từ khóa tìm kiếm
        );

        if (!res.ok) throw new Error("Lỗi khi fetch ảnh"); // Kiểm tra nếu API không trả kết quả đúng

        const data = await res.json(); // Chuyển đổi dữ liệu từ JSON

        // Chuyển đổi kết quả từ API để đảm bảo có `fullSrc` (ảnh full-size)
        const newImages = data.results.map(
          (img: {
            id: string;
            urls: { small: string; full: string };
            alt_description?: string;
          }) => ({
            id: img.id, // ID ảnh
            src: img.urls.small, // Ảnh preview
            fullSrc: img.urls.full, // Ảnh full-size
            alt: img.alt_description || "Image", // Nếu không có mô tả, gán là "Image"
          })
        );

        setImages(newImages); // Lưu danh sách ảnh vào state
      } catch (error) {
        console.error("❌ Lỗi:", error); // Xử lý lỗi
      }
    };

    fetchSearchResults(); // Gọi hàm fetch ảnh
  }, [query, API_KEY]); // Hook sẽ chạy lại khi `query` hoặc `API_KEY` thay đổi

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-4">
        {query ? `Kết quả tìm kiếm: "${query}"` : "Tìm kiếm ảnh"} {/* Hiển thị tiêu đề */}
      </h1>

      {/* Hiển thị ảnh theo dạng Masonry Grid */}
      <MasonryGrid images={images} onImageClick={setSelectedImage} />

      {/* Nếu có ảnh được chọn, hiển thị modal */}
      {selectedImage && selectedImage.fullSrc && (
        <ImageModal image={selectedImage} onClose={() => setSelectedImage(null)} />
      )}
    </div>
  );
}

// Component chính bao bọc bằng Suspense
export default function SearchPage() {
  return (
    <Suspense fallback={<div>Đang tải...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}