"use client";

import { useState, useEffect } from "react";
import { doc, setDoc, collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { useAuth } from "@/app/context/AuthContext";
import Image from "next/image";
import { useRouter } from "next/navigation"; // Thêm useRouter

interface SaveModalProps {
  imageUrl: string;
  onClose: () => void;
}

const SaveModal: React.FC<SaveModalProps> = ({ imageUrl, onClose }) => {
  const { user } = useAuth();
  const [collections, setCollections] = useState<{ id: string; name: string }[]>([]);
  const [selectedCollection, setSelectedCollection] = useState("");
  const [newCollection, setNewCollection] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [loadingCollections, setLoadingCollections] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const router = useRouter(); // Khởi tạo router


  // 🛠 Lấy danh sách collections từ Firestore
  useEffect(() => {
    if (user) {
      const fetchCollections = async () => {
        setLoadingCollections(true);
        try {
          const querySnapshot = await getDocs(collection(db, "users", user.uid, "collections"));
          const fetchedCollections = querySnapshot.docs.map((doc) => ({
            id: doc.id, // Dùng id để làm key
            name: doc.id, // Firestore doc.id chính là tên bảng
          }));
          setCollections(fetchedCollections);
        } catch (error) {
          console.error("Lỗi khi lấy collections:", error);
        }
        setLoadingCollections(false);
      };
      fetchCollections();
    }
  }, [user]);

  // 🛠 Lưu ảnh vào bảng đã chọn
  const handleSave = async () => {
    if (!user) {
      router.push("/login"); // 🚀 Chuyển đến trang đăng nhập
      return;
    }
    if (!selectedCollection) {
      alert("Vui lòng chọn bảng.");
      return;
    }

    setIsSaving(true);
    try {
      await addDoc(collection(db, "users", user.uid, "collections", selectedCollection, "images"), {
        url: imageUrl,
        timestamp: new Date(),
      });
      alert("Lưu ảnh thành công!");
      onClose();
    } catch (error) {
      console.error("Lỗi khi lưu ảnh:", error);
      alert("Có lỗi xảy ra khi lưu ảnh.");
    }
    setIsSaving(false);
  };

  // 🛠 Tạo bảng mới và lưu ảnh vào đó
  const handleCreateCollection = async () => {
    if (!user) {
      alert("Vui lòng đăng nhập để tạo bảng.");
      return;
    }
    if (!newCollection.trim()) {
      alert("Tên bảng không được để trống.");
      return;
    }

    try {
      // Tạo bảng mới
      const newCollectionRef = doc(db, "users", user.uid, "collections", newCollection);
      await setDoc(newCollectionRef, { createdAt: new Date(), name: newCollection });

      // Lưu ảnh vào bảng mới
      await addDoc(collection(newCollectionRef, "images"), {
        url: imageUrl,
        timestamp: new Date(),
      });

      // Cập nhật danh sách bảng
      setCollections([...collections, { id: newCollection, name: newCollection }]);
      setSelectedCollection(newCollection);
      setNewCollection("");
      setShowCreateModal(false);
      alert("Tạo bảng thành công và ảnh đã được lưu!");
    } catch (error) {
      console.error("Lỗi khi tạo bảng:", error);
      alert("Có lỗi xảy ra khi tạo bảng.");
    }
    onClose(); // Đóng modal sau khi lưu xong
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      {showCreateModal ? (
        <div className="bg-white p-6 rounded-lg shadow-lg w-[500px] flex relative">
          <Image src={imageUrl} alt="Preview" width={200} height={200} className="rounded-md" priority />


          <div className="ml-4 flex-1">
            <h2 className="text-lg font-semibold mb-2">Tạo bảng</h2>
            <input
              type="text"
              value={newCollection}
              onChange={(e) => setNewCollection(e.target.value)}
              placeholder="Nhập tên bảng"
              className="w-full p-2 border rounded-md mb-3"
            />
            <button
              onClick={handleCreateCollection}
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
            >
              Tạo
            </button>
            <button onClick={() => setShowCreateModal(false)} className="w-full mt-2 text-gray-600">
              Hủy
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-lg w-80 relative">
          <h2 className="text-lg font-semibold mb-3">Lưu ảnh</h2>
          {loadingCollections ? (
            <p className="text-gray-500 text-sm">Đang tải...</p>
          ) : collections.length > 0 ? (
            <select
              value={selectedCollection}
              onChange={(e) => setSelectedCollection(e.target.value)}
              className="w-full p-2 border rounded-md mb-3"
            >
              <option value="">Chọn bảng</option>
              {collections.map((col) => (
                <option key={col.id} value={col.id}>{col.name}</option> // ✅ Dùng id làm key
              ))}
            </select>
          ) : (
            <p className="text-gray-500 text-sm">Chưa có bảng nào.</p>
          )}

          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full bg-gray-200 text-black py-2 rounded-md hover:bg-gray-300 transition"
          >
            + Tạo bảng mới
          </button>
          <button
            onClick={handleSave}
            className="w-full bg-red-600 text-white py-2 mt-3 rounded-md hover:bg-red-700 transition"
            disabled={isSaving}
          >
            {isSaving ? "Đang lưu..." : "Lưu"}
          </button>
          <button onClick={onClose} className="w-full mt-2 text-gray-600">
            Hủy
          </button>
        </div>
      )}
    </div>
  );
};

export default SaveModal;
