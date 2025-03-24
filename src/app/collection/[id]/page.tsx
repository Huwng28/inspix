"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { auth, db } from "@/lib/firebaseConfig";
import { collection, deleteDoc, doc, getDocs } from "firebase/firestore";
import Image from "next/image";

const CollectionDetail = () => {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [images, setImages] = useState<{ id: string; url: string }[]>([]);
  const [collectionName, setCollectionName] = useState("");
  const [hoveredImage, setHoveredImage] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false); // Trạng thái tải

  useEffect(() => {
    if (!id) {
      console.error(" Không tìm thấy ID bộ sưu tập");
      router.push("/personal");
    }
  }, [id, router]);

  const fetchCollection = useCallback(async () => {
    if (!auth.currentUser || !id) return;

    try {
      const userId = auth.currentUser.uid;
      const imagesRef = collection(db, "users", userId, "collections", id, "images");
      const querySnapshot = await getDocs(imagesRef);

      const fetchedImages = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        url: doc.data().url,
      }));
      setImages(fetchedImages);
      setCollectionName(`Bộ sưu tập ${id}`);
    } catch (error) {
      console.error(" Lỗi khi lấy ảnh:", error);
    }
  }, [id]);

  const deleteImage = async (imageId: string) => {
    if (!auth.currentUser || !id) return;
    if (!confirm("Bạn có chắc muốn xóa ảnh này?")) return;

    try {
      const userId = auth.currentUser.uid;
      await deleteDoc(doc(db, "users", userId, "collections", id, "images", imageId));
      setImages((prevImages) => prevImages.filter((image) => image.id !== imageId));
    } catch (error) {
      console.error(" Lỗi khi xóa ảnh:", error);
    }
  };

  const deleteCollection = async () => {
    if (!auth.currentUser || !id) return;
    if (!confirm("Bạn có chắc muốn xóa bộ sưu tập này?")) return;

    try {
      const userId = auth.currentUser.uid;
      await deleteDoc(doc(db, "users", userId, "collections", id));
      alert("✅ Đã xóa bộ sưu tập!");
      router.push("/personal");
    } catch (error) {
      console.error(" Lỗi khi xóa bộ sưu tập:", error);
    }
  };

  // Hàm tải ảnh
  const handleDownload = async () => {
    if (!selectedImage) return;

    try {
      setIsDownloading(true);
      const response = await fetch(selectedImage, { mode: "cors" });
      if (!response.ok) throw new Error("Không thể tải ảnh");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `image.${blob.type.split("/")[1] || "jpg"}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Lỗi khi tải ảnh:", error);
      alert("Không thể tải ảnh do lỗi CORS hoặc kết nối. Vui lòng thử lại!");
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    if (id) fetchCollection();
  }, [id, fetchCollection]);

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl w-full bg-white p-6 rounded-lg shadow-lg">
        {/* Tiêu đề + Nút Xóa */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">{collectionName}</h1>
          <button
            onClick={deleteCollection}
            className="px-4 py-2 text-white bg-red-500 rounded-md hover:bg-red-600 transition"
          >
            🗑 Xóa bộ sưu tập
          </button>
        </div>

        {/* Hiển thị ảnh trong bộ sưu tập */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.length > 0 ? (
            images.map((image) => (
              <div
                key={image.id}
                className="relative group overflow-hidden rounded-lg shadow-md cursor-pointer"
                onMouseEnter={() => setHoveredImage(image.id)}
                onMouseLeave={() => setHoveredImage(null)}
                onClick={() => setSelectedImage(image.url)}
              >
                <Image
                  src={image.url}
                  alt="Ảnh"
                  width={300}
                  height={200}
                  className="w-full h-40 object-cover transition-transform transform group-hover:scale-105"
                />

                {/* Nút xóa chỉ hiển thị khi hover */}
                {hoveredImage === image.id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteImage(image.id);
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded opacity-80 hover:opacity-100"
                  >
                    Xóa
                  </button>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center w-full">Chưa có ảnh nào trong bộ sưu tập.</p>
          )}
        </div>
      </div>

      {/* Modal hiển thị ảnh lớn */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50 p-4">
          <div className="relative w-full h-full max-h-[80vh] flex items-center justify-center">
            <div className="relative w-auto h-auto max-h-[80vh] flex items-center justify-center">
              <Image
                src={selectedImage}
                alt="Ảnh lớn"
                width={0}
                height={0}
                sizes="100vw"
                className="w-auto h-auto max-h-[80vh] object-contain"
                priority
              />

              {/* Container cho 2 nút, góc trên bên phải */}
              <div className="absolute top-2 right-2 flex space-x-2">
                {/* Nút tải ảnh */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload();
                  }}
                  disabled={isDownloading}
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

                {/* Nút đóng */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImage(null);
                  }}
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionDetail;