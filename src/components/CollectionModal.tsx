"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";

interface CollectionModalProps {
  onClose: () => void;
}

export default function CollectionModal({ onClose }: CollectionModalProps) {
  const [collectionName, setCollectionName] = useState(""); // state lưu tên bộ sưu tập
  const [loading, setLoading] = useState(false); // state quản lý trạng thái loading
  const router = useRouter(); // hook Next.js router
  const auth = getAuth(); // lấy thông tin auth từ Firebase
  const user = auth.currentUser; // lấy người dùng hiện tại từ Firebase

  const handleCreateCollection = async () => {
    if (!user) {
      alert("Vui lòng đăng nhập để tạo bộ sưu tập."); // nếu người dùng chưa đăng nhập
      return;
    }

    if (!collectionName.trim()) {
      alert("Tên bộ sưu tập không được để trống."); // nếu tên bộ sưu tập trống
      return;
    }

    setLoading(true); // bật trạng thái loading

    try {
      const collectionId = collectionName.trim(); // sử dụng tên nhập vào làm ID cho bộ sưu tập
      const collectionRef = doc(db, "users", user.uid, "collections", collectionId); // tạo tham chiếu tới bộ sưu tập trong Firestore

      await setDoc(collectionRef, {
        name: collectionName, // lưu tên bộ sưu tập
        createdAt: new Date(), // lưu thời gian tạo bộ sưu tập
      });

      router.push(`/collection/${collectionId}`); // chuyển hướng đến bộ sưu tập mới tạo

      // Reset & đóng modal
      setCollectionName(""); // reset lại giá trị input
      onClose(); // đóng modal sau khi tạo bộ sưu tập
    } catch (error) {
      console.error("Lỗi khi tạo bộ sưu tập:", error); // log lỗi nếu có
      alert("Đã xảy ra lỗi khi tạo bộ sưu tập."); // hiển thị thông báo lỗi
    } finally {
      setLoading(false); // tắt trạng thái loading
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-80">
        <h2 className="text-xl font-bold mb-4">Tạo bộ sưu tập mới</h2>
        <input
          type="text"
          placeholder="Nhập tên bộ sưu tập..."
          value={collectionName}
          onChange={(e) => setCollectionName(e.target.value)} // cập nhật tên bộ sưu tập khi người dùng nhập
          className="w-full p-2 border border-gray-300 rounded-md outline-none"
        />
        <div className="flex justify-end mt-4 space-x-2">
          <button
            onClick={onClose} // đóng modal khi nhấn Hủy
            className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md"
            disabled={loading} // vô hiệu hóa khi đang loading
          >
            Hủy
          </button>
          <button
            onClick={handleCreateCollection} // gọi hàm tạo bộ sưu tập
            className="px-4 py-2 text-white bg-red-500 rounded-md hover:bg-red-600 transition disabled:opacity-50"
            disabled={loading} // vô hiệu hóa khi đang loading
          >
            {loading ? "Đang tạo..." : "Tạo"} {/* hiển thị trạng thái "Đang tạo..." khi đang load */}
          </button>
        </div>
      </div>
    </div>
  );
}
