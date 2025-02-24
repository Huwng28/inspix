"use client";

import { useState } from "react";
import Image from "next/image";
import SaveModal from "./SaveModal";
import { useAuth } from "@/app/context/AuthContext"; // ✅ Lấy AuthContext
import { useRouter } from "next/navigation"; // ✅ Dùng router để chuyển trang

interface ImageCardProps {
  imageUrl: string;
}

const ImageCard: React.FC<ImageCardProps> = ({ imageUrl }) => {
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false); // state để điều khiển việc hiển thị modal lưu ảnh
  const { user } = useAuth(); // ✅ Lấy thông tin đăng nhập từ context
  const router = useRouter(); // ✅ Để điều hướng trang



  const handleSaveClick = () => {
    console.log("🔹 User hiện tại:", user); // ✅ In ra console để debug

    if (!user) {
      console.log("🚨 Chưa đăng nhập! Chuyển hướng sang /login");
      router.push("/login"); // 🚀 Nếu chưa đăng nhập, chuyển đến trang login
      return;
    }

    console.log("✅ Đã đăng nhập! Mở modal lưu ảnh");
    setIsSaveModalOpen(true); // Mở modal để lưu ảnh khi đã đăng nhập
  };

  const closeModal = () => {
    console.log("Closing modal from ImageCard");
    setIsSaveModalOpen(false); // Đóng modal khi người dùng nhấn nút đóng
  };

  return (
    <>
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <SaveModal imageUrl={imageUrl} onClose={closeModal} /> {/* Hiển thị modal lưu ảnh */}
        </div>
      )}

      <div className="relative group">
        <Image
          src={imageUrl}
          alt="Ảnh"
          width={300}
          height={400}
          quality={80} // ⚡ Bây giờ sẽ có hiệu lực
          className="w-full rounded-lg shadow-lg"
          priority // ⚡ Tự động tải trước, không cần `loading="eager"`
          placeholder="blur" // ⚡ Hiển thị ảnh mờ trước khi tải đầy đủ
        />



        <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
          <button
            onClick={handleSaveClick} // ✅ Dùng hàm kiểm tra đăng nhập
            className="bg-red-600 text-white font-bold py-2 rounded-lg w-full hover:bg-red-700 transition"
          >
            Lưu
          </button>
        </div>
      </div>
    </>
  );
};

export default ImageCard;
