"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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

// Component để xử lý logic chính
function HomePageContent() {
  const [images, setImages] = useState<ImageData[]>([]);
  const [page, setPage] = useState(1);
  const [hasMoreUnsplash, setHasMoreUnsplash] = useState(true);
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null); // Sửa ở đây
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