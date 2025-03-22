"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebaseConfig";
import { onAuthStateChanged, updateProfile, User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Image from "next/image";

const EditProfile = () => {
  const [user, setUser] = useState<User | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const router = useRouter();

  // Hàm nén ảnh và chuyển thành base64
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const img = document.createElement("img");
      const reader = new FileReader();

      reader.onload = (e) => {
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.8)); // Chuyển thành base64 với chất lượng 80%
        };
      };
      reader.readAsDataURL(file);
    });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
      } else {
        setUser(currentUser);
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setFirstName(data.firstName || "");
          setLastName(data.lastName || "");
          setBio(data.bio || "");
          setPhotoURL(data.avatar || ""); // Lấy từ trường avatar trong Firestore
        }
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Xử lý khi chọn ảnh mới
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressedImage = await compressImage(file);
      setPhotoURL(compressedImage); // Hiển thị ảnh preview
    }
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      // Chuẩn bị dữ liệu để lưu vào Firestore
      const updatedData = {
        firstName,
        lastName,
        bio,
        username: user.email?.split("@")[0],
        avatar: photoURL, // Lưu ảnh dưới dạng base64 vào trường avatar trong Firestore
      };

      // Lưu dữ liệu vào Firestore
      await setDoc(doc(db, "users", user.uid), updatedData);

      // Cập nhật profile của user trong Firebase Auth (chỉ cập nhật displayName)
      await updateProfile(user, {
        displayName: `${firstName} ${lastName}`,
        // Không cập nhật photoURL vì chuỗi base64 quá dài
      });

      alert("Cập nhật thành công!");
      router.push("/personal");
    } catch (error) {
      console.error("Lỗi cập nhật:", error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Chỉnh sửa hồ sơ</h1>
      <p className="text-gray-600 mb-4">Hãy giữ riêng tư thông tin cá nhân của bạn.</p>

      {/* Ảnh đại diện */}
      <div className="flex items-center mb-4 gap-4">
        <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center text-2xl font-bold overflow-hidden">
          {photoURL ? (
            <Image
              src={photoURL}
              alt="Avatar"
              width={80}
              height={80}
              className="object-cover"
            />
          ) : (
            user?.displayName?.charAt(0) || "U"
          )}
        </div>
        <label className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Thay đổi ảnh
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </label>
      </div>

      {/* Nhập thông tin */}
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          placeholder="Tên"
          className="w-1/2 p-2 border rounded"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Họ"
          className="w-1/2 p-2 border rounded"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
      </div>

      {/* Tiểu sử */}
      <textarea
        placeholder="Giới thiệu bản thân"
        className="w-full p-2 border rounded mb-4"
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        rows={3}
        maxLength={160}
      />

      {/* Username */}
      <input
        type="text"
        className="w-full p-2 border rounded mb-4 bg-gray-100"
        value={user?.email?.split("@")[0] || ""}
        readOnly
      />

      <div className="flex gap-4">
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Lưu
        </button>
      </div>
    </div>
  );
};

export default EditProfile;