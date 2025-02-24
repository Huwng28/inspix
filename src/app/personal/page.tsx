"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebaseConfig";
import { User, onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query } from "firebase/firestore";
import Image from "next/image";
import Link from "next/link";
import CollectionModal from "@/components/CollectionModal";

const ProfilePage = () => {
  // Khai báo state để lưu thông tin người dùng và bộ sưu tập
  const [user, setUser] = useState<User | null>(null);
  const [collections, setCollections] = useState<{ id: string; name: string; previewImage?: string }[]>([]);
  const router = useRouter(); // Hook điều hướng trang
  const [isModalOpen, setIsModalOpen] = useState(false); // Trạng thái để mở/đóng modal

  // useEffect để theo dõi trạng thái đăng nhập của người dùng
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/login"); // Nếu không có người dùng, chuyển hướng đến trang login
      } else {
        setUser(currentUser); // Nếu có người dùng, lưu thông tin vào state
        fetchCollections(currentUser.uid); // Lấy danh sách bộ sưu tập của người dùng
      }
    });

    return () => unsubscribe(); // Hàm dọn dẹp khi component unmount
  }, [router]);

  // Hàm để lấy danh sách bộ sưu tập của người dùng từ Firestore
  const fetchCollections = async (userId: string) => {
    try {
      const q = query(collection(db, "users", userId, "collections"));
      const querySnapshot = await getDocs(q); // Lấy tất cả bộ sưu tập từ Firestore
      const data = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
          const imagesRef = collection(db, "users", userId, "collections", doc.id, "images");
          const imagesSnapshot = await getDocs(imagesRef); // Lấy tất cả ảnh trong bộ sưu tập

          const firstImage = imagesSnapshot.docs.length > 0 ? imagesSnapshot.docs[0].data().url : null;

          return {
            id: doc.id, // Lấy ID bộ sưu tập
            name: doc.data().name, // Lấy tên bộ sưu tập
            previewImage: firstImage || undefined, // Lấy ảnh đầu tiên làm ảnh đại diện
          };
        })
      );
      setCollections(data); // Lưu thông tin bộ sưu tập vào state
    } catch (error) {
      console.error("❌ Lỗi khi lấy bộ sưu tập:", error); // Log lỗi nếu có
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-white p-6">
      {/* Hồ sơ cá nhân */}
      <div className="text-center mb-6">
        <div className="w-24 h-24 mx-auto bg-gray-300 rounded-full flex items-center justify-center text-3xl font-bold">
          {user?.displayName?.charAt(0)} {/* Hiển thị chữ cái đầu tiên của tên người dùng */}
        </div>
        <h1 className="text-2xl font-bold mt-2">{user?.displayName}</h1> {/* Hiển thị tên người dùng */}
        <p className="text-gray-500">@{user?.email?.split("@")[0]}</p> {/* Hiển thị tên người dùng từ email */}

        <Link href="/edit-profile">
          <button className="mt-4 px-4 py-2 bg-gray-300 text-black rounded-full hover:bg-gray-400">
            Chỉnh sửa hồ sơ
          </button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex space-x-8 border-b pb-2 mb-4">
        <button className="font-medium text-gray-600 border-b-2 border-black pb-2">Đã lưu</button>
      </div>

      {/* Bộ sưu tập */}
      <div className="w-full max-w-4xl">
        <h2 className="text-lg font-semibold mb-4">📁 Bộ sưu tập</h2>       
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {collections.map((col) => (
            <Link key={col.id} href={`/collection/${col.id}`}>
              <div className="relative bg-gray-100 rounded-lg p-2 shadow-md">
                {col.previewImage ? (
                  <Image
                    src={col.previewImage}
                    alt={`Bộ sưu tập ${col.name}`}
                    width={200}
                    height={200}
                    className="w-full h-32 object-cover rounded-md"
                  />
                ) : (
                  <div className="w-full h-32 bg-gray-200 rounded-md flex items-center justify-center text-gray-500">
                    Chưa có ảnh
                  </div>
                )}
                <p className="text-center mt-2 font-medium">{col.name}</p>
              </div>
            </Link>
          ))}

          {/* Dấu "+" để thêm bộ sưu tập */}
          <button
            className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center text-3xl font-bold text-gray-500 hover:bg-gray-200 transition"
            onClick={() => setIsModalOpen(true)} // Mở modal khi nhấn dấu "+"
          >
            +
          </button>
        </div>
      </div>

      {/* Modal thêm bộ sưu tập */}
      {isModalOpen && <CollectionModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
};

export default ProfilePage;
