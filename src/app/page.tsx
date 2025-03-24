"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import MasonryGrid from "@/components/MasonryGrid";
import Image from "next/image";

interface ImageData {
  id: string;
  src: string;
  fullSrc: string;
  alt: string;
}

interface UnsplashImage {
  id: string;
  urls: {
    small: string;
    full: string;
  };
  alt_description?: string;
}

interface UnsplashResponse {
  results?: UnsplashImage[];
}

// Component để xử lý logic chính
function HomePageContent() {
  const [images, setImages] = useState<ImageData[]>([]);
  const [page, setPage] = useState(1);
  const [hasMoreUnsplash, setHasMoreUnsplash] = useState(true);
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const observerRef = useRef<HTMLDivElement | null>(null);
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("q") || "";

  const API_KEY = process.env.NEXT_PUBLIC_UNSPLASH_API_KEY;

  const fetchImages = useCallback(async () => {
    if (!API_KEY || !hasMoreUnsplash || isLoading) return;

    setIsLoading(true);
    try {
      let url = `https://api.unsplash.com/photos?page=${page}&per_page=10&client_id=${API_KEY}`;
      if (searchQuery) {
        url = `https://api.unsplash.com/search/photos?page=${page}&per_page=10&query=${encodeURIComponent(
          searchQuery
        )}&client_id=${API_KEY}`;
      }

      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`Lỗi API: ${res.status}`);
      const data: UnsplashResponse = await res.json();

      const newImages: ImageData[] = (Array.isArray(data) ? data : data.results || []).map(
        (img: UnsplashImage) => ({
          id: img.id,
          src: img.urls.small,
          fullSrc: img.urls.full,
          alt: img.alt_description || "Image",
        })
      );

      setImages((prev) => {
        const allImages = [...prev, ...newImages];
        return Array.from(new Map(allImages.map((img) => [img.id, img])).values());
      });

      if (newImages.length < 10) setHasMoreUnsplash(false);
    } catch (error) {
      console.error("Lỗi khi fetch ảnh từ Unsplash:", error);
    } finally {
      setIsLoading(false);
    }
  }, [page, searchQuery, API_KEY, hasMoreUnsplash, isLoading]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  useEffect(() => {
    if (!observerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreUnsplash) {
          setPage((prevPage) => prevPage + 1);
        }
      },
      { rootMargin: "100px" }
    );

    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [hasMoreUnsplash]);

  // Hàm xử lý tải ảnh về máy bằng cách fetch dữ liệu ảnh dưới dạng blob
  const handleDownload = async () => {
    if (!selectedImage) return;

    try {
      // Fetch dữ liệu ảnh dưới dạng blob
      const response = await fetch(selectedImage.fullSrc, {
        mode: "cors", // Đảm bảo CORS được xử lý
      });
      if (!response.ok) throw new Error("Không thể tải ảnh");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob); // Tạo URL từ blob
      const link = document.createElement("a");
      link.href = url;
      link.download = selectedImage.alt || "image"; // Tên file tải về
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url); // Giải phóng URL blob
    } catch (error) {
      console.error("Lỗi khi tải ảnh:", error);
      alert("Không thể tải ảnh do lỗi CORS hoặc kết nối. Vui lòng thử lại!");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-4">
        {searchQuery ? `Kết quả tìm kiếm: "${searchQuery}"` : "Khám phá"}
      </h1>
      <MasonryGrid
        images={images}
        onImageClick={(image) => setSelectedImage(image)}
      />

      {/* Hiển thị ảnh full màn hình khi nhấn vào ảnh */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50 p-4">
          <div className="relative w-full h-full max-h-[80vh] flex items-center justify-center">
            {/* Container cho ảnh và các nút */}
            <div className="relative w-auto h-auto max-h-[80vh] flex items-center justify-center">
              <Image
                src={selectedImage.fullSrc || ""}
                alt={selectedImage.alt || "Hình ảnh"}
                width={0}
                height={0}
                sizes="100vw"
                className="w-auto h-auto max-h-[80vh] object-contain"
                priority
              />

              {/* Container cho 2 nút, nằm bên trong ảnh, góc trên bên phải */}
              <div className="absolute top-2 right-2 flex space-x-2">
                {/* Icon tải ảnh */}
                <button
                  onClick={handleDownload}
                  className="text-white hover:text-gray-300 transition-colors bg-black bg-opacity-50 rounded-full p-1"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                </button>

                {/* Nút đóng (X) */}
                <button
                  onClick={() => setSelectedImage(null)}
                  className="text-white hover:text-gray-300 transition-colors bg-black bg-opacity-50 rounded-full p-1"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={observerRef} className="h-10">
        {hasMoreUnsplash && <p className="text-center text-gray-500"></p>}
        {!hasMoreUnsplash && <p className="text-center text-gray-500"></p>}
      </div>
    </div>
  );
}

// Export component chính với Suspense
export default function HomePage() {
  return (
    <Suspense fallback={<div>Đang tải...</div>}>
      <HomePageContent />
    </Suspense>
  );
}