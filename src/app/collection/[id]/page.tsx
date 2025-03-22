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
  const [selectedImage, setSelectedImage] = useState<string | null>(null); // 🔥 State mở modal

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
                onClick={() => setSelectedImage(image.url)} // 🔥 Nhấn vào ảnh để mở modal
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
                      e.stopPropagation(); // 🔥 Ngăn sự kiện click lan ra modal
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

      {/* 🔥 Modal hiển thị ảnh lớn (Theo yêu cầu) */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50"
          onClick={() => setSelectedImage(null)} // 🔥 Click ngoài để đóng modal
        >
          <div className="relative max-w-[90vw] max-h-[80vh]">
            {/* ✅ Ảnh tự động co lại nếu quá to */}
            <Image
              src={selectedImage}
              alt="Ảnh lớn"
              width={0} // Next.js sẽ tự động tính toán kích thước
              height={0}
              sizes="90vw"
              className="w-auto h-auto max-w-[90vw] max-h-[80vh] object-contain rounded-lg"
              quality={80}
              priority
            />

            {/* ✅ Nút đóng (✖) gắn vào góc trên bên phải của ảnh */}
            <button
              className="absolute top-1 right-1 translate-x-1/2 -translate-y-1/2 text-white px-3 py-1 rounded-full z-10"
              onClick={(e) => {
                e.stopPropagation(); // 🔥 Ngăn đóng modal khi click vào nút
                setSelectedImage(null);
              }}
            >
              ✖
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionDetail;
