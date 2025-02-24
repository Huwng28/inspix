"use client"; // Đảm bảo code này chỉ chạy trên client-side.

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation"; // Lấy tham số tìm kiếm từ URL
import MasonryGrid from "@/components/MasonryGrid"; // Component hiển thị ảnh dạng lưới
import ImageModal from "@/components/ImageModal"; // Component hiển thị ảnh trong modal

interface ImageData {
  id: string;
  src: string;
  fullSrc: string;
  alt: string;
}

export default function HomePage() {
  const [images, setImages] = useState<ImageData[]>([]); // State chứa danh sách ảnh tìm kiếm
  const [page, setPage] = useState(1); // State chứa trang hiện tại
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null); // State chứa ảnh được chọn
  const observerRef = useRef<HTMLDivElement | null>(null); // Tham chiếu đến phần tử để theo dõi khi cuộn

  const searchParams = useSearchParams(); // Lấy các tham số từ URL
  const query = searchParams.get("q") || ""; // Lấy giá trị từ khóa tìm kiếm từ tham số `q`

  const API_KEY = process.env.NEXT_PUBLIC_UNSPLASH_API_KEY; // Lấy API Key từ biến môi trường

  // Fetch ảnh từ Unsplash API khi `page` hoặc `query` thay đổi
  const fetchImages = useCallback(async () => {
    if (!API_KEY) {
      console.error("❌ API Key bị thiếu. Kiểm tra file .env.local");
      return;
    }

    try {
      let url = `https://api.unsplash.com/photos?page=${page}&per_page=10&client_id=${API_KEY}`;
      if (query) {
        url = `https://api.unsplash.com/search/photos?page=${page}&per_page=10&query=${encodeURIComponent(query)}&client_id=${API_KEY}`;
      }

      const res = await fetch(url, { cache: "no-store" }); // Gọi API Unsplash với trang và từ khóa
      if (!res.ok) throw new Error(`Lỗi API: ${res.status}`); // Kiểm tra nếu API không trả kết quả đúng

      const data = await res.json(); // Chuyển đổi dữ liệu từ JSON

      // Chuyển đổi kết quả từ API để đảm bảo có `fullSrc` (ảnh full-size)
      const newImages: ImageData[] = (Array.isArray(data) ? data : data.results).map((img: { 
        id: string; 
        urls: { small: string; full: string }; 
        alt_description?: string 
      }) => ({
        id: img.id, // ID ảnh
        src: img.urls.small, // Ảnh preview
        fullSrc: img.urls.full, // Ảnh full-size
        alt: img.alt_description || "Image", // Nếu không có mô tả, gán là "Image"
      }));

      setImages((prev) => {
        const allImages = [...prev, ...newImages];
        return Array.from(new Map(allImages.map((img) => [img.id, img])).values()); // Loại bỏ ảnh trùng lặp
      });
    } catch (error) {
      console.error("❌ Lỗi khi fetch ảnh:", error); // Xử lý lỗi
    }
  }, [page, query, API_KEY]);

  useEffect(() => {
    fetchImages(); // Gọi hàm fetch ảnh khi trang tải
  }, [fetchImages]); // Chạy lại khi `fetchImages` thay đổi

  useEffect(() => {
    if (!observerRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage((prevPage) => prevPage + 1); // Tăng trang khi cuộn đến cuối
        }
      },
      { rootMargin: "1000px" } // Kích hoạt khi gần đến cuối trang
    );

    observer.observe(observerRef.current); // Theo dõi phần tử có ref
    return () => observer.disconnect(); // Ngắt kết nối observer khi component unmount
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-4">
        {query ? `Kết quả tìm kiếm: "${query}"` : "Ảnh Mới Nhất"}
      </h1>

      {/* ✅ Truyền images & hàm mở modal vào MasonryGrid */}
      <MasonryGrid
        images={images}
        onImageClick={(image) => setSelectedImage(image)} // Mở modal khi chọn ảnh
      />

      {/* 📌 Hiển thị modal khi chọn ảnh */}
      {selectedImage && (
        <ImageModal
          image={selectedImage}
          onClose={() => setSelectedImage(null)} // Đóng modal khi nhấn nút đóng
        />
      )}

      {/* Loader để load thêm ảnh */}
      <div ref={observerRef} className="h-10"></div>
    </div>
  );
}
