"use client"; // Đảm bảo code này chỉ chạy trên client-side

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react"; // Thêm Suspense để bao bọc useSearchParams
import MasonryGrid from "@/components/MasonryGrid";
import ImageModal from "@/components/ImageModal";

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

// Component nội bộ chứa logic chính
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

      const newImages: ImageData[] = (
        Array.isArray(data) ? data : data.results || []
      ).map((img: UnsplashImage) => ({
        id: img.id,
        src: img.urls.small,
        fullSrc: img.urls.full,
        alt: img.alt_description || "Image",
      }));

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

  // Fetch ảnh khi searchQuery hoặc page thay đổi
  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  // Thiết lập IntersectionObserver cho infinite scroll
  useEffect(() => {
    if (!observerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreUnsplash && !isLoading) {
          setPage((prevPage) => prevPage + 1);
        }
      },
      { rootMargin: "100px" }
    );

    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [hasMoreUnsplash, isLoading]);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-4">
        {searchQuery ? `Kết quả tìm kiếm: "${searchQuery}"` : "Khám phá"}
      </h1>
      <MasonryGrid
        images={images}
        onImageClick={(image) => setSelectedImage(image)}
      />
      {selectedImage && (
        <ImageModal
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
      <div ref={observerRef} className="h-10">
        {isLoading && <p className="text-center text-gray-500">Đang tải...</p>}
        {!hasMoreUnsplash && !isLoading && (
          <p className="text-center text-gray-500">Không còn ảnh để tải</p>
        )}
      </div>
    </div>
  );
}

// Component chính bao bọc bằng Suspense
export default function HomePage() {
  return (
    <Suspense fallback={<div className="text-center p-4">Đang tải...</div>}>
      <HomePageContent />
    </Suspense>
  );
}