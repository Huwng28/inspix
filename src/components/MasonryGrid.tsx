"use client";

import { useState } from "react";
import Masonry from "react-masonry-css";
import Image from "next/image";
import SaveModal from "./SaveModal"; // Import Modal

interface ImageData {
  id: string;
  src: string;
  fullSrc: string;
  alt: string;
}

interface MasonryGridProps {
  images: ImageData[];
  onImageClick: (image: ImageData) => void;
}

const MasonryGrid: React.FC<MasonryGridProps> = ({ images, onImageClick }) => {
  const breakpointColumnsObj = {
    default: 4,
    1100: 3,
    768: 2,
    500: 1,
  };

  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);

  return (
    <>
      {/* Hiển thị modal khi nhấn Lưu */}
      {selectedImage && (
        <SaveModal imageUrl={selectedImage.fullSrc} onClose={() => setSelectedImage(null)} />
      )}

      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="masonry-grid"
        columnClassName="masonry-grid_column"
      >
        {images.map((image) => (
          <ImageCard key={image.id} image={image} onImageClick={onImageClick} onSave={() => setSelectedImage(image)} />
        ))}
      </Masonry>
    </>
  );
};

function ImageCard({
  image,
  onImageClick,
  onSave,
}: {
  image: ImageData;
  onImageClick: (image: ImageData) => void;
  onSave: () => void;
}) {
  const [loading, setLoading] = useState(true);

  return (
    <div className="relative mb-4 p-2 rounded-lg group">
      {/* Skeleton Loading */}
      {loading && (
        <div className="w-full bg-gray-300 animate-pulse rounded-lg" style={{ aspectRatio: "3 / 4" }}></div>
      )}

      {/* Ảnh */}
      <button onClick={() => onImageClick(image)} className="relative w-full overflow-hidden rounded-lg focus:outline-none">
        <Image
          src={image.src}
          alt={image.alt}
          width={300}
          height={400}
          className={`w-full h-auto rounded-lg transition-transform duration-300 ease-in-out group-hover:scale-105 ${loading ? "opacity-0" : "opacity-100"
            }`}
          onLoad={() => setLoading(false)}
        />

        {/* Overlay (Nền mờ khi hover) */}
        <div className="absolute inset-0 bg-black bg-opacity-0 transition-opacity duration-300 group-hover:bg-opacity-40"></div>

        {/* Text Hover */}
        <p className="absolute bottom-4 left-4 text-white text-sm opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          {image.alt || "Xem ảnh"}
        </p>
      </button>

      {/* Nút Lưu */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button onClick={onSave} className="bg-red-600 text-white px-3 py-1 text-sm rounded-md shadow-md">
          Lưu
        </button>
      </div>
    </div>
  );
}

export default MasonryGrid;
