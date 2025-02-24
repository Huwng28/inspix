"use client"; // Đánh dấu component là client-side, nghĩa là component này chạy trên trình duyệt

import { useEffect, useState } from "react"; // Import các hook cần thiết của React
import { useRouter } from "next/navigation"; // Import next/router cho Pages Router
import { auth, db } from "@/lib/firebaseConfig"; // Import cấu hình Firebase
import { onAuthStateChanged, updateProfile, User } from "firebase/auth"; // Import các hàm từ Firebase auth
import { doc, getDoc, setDoc } from "firebase/firestore"; // Import các hàm từ Firestore
import Image from "next/image"; // Import Image từ Next.js

const EditProfile = () => {
  const [user, setUser] = useState<User | null>(null); // State lưu thông tin người dùng
  const [firstName, setFirstName] = useState(""); // State lưu tên người dùng
  const [lastName, setLastName] = useState(""); // State lưu họ người dùng
  const [bio, setBio] = useState(""); // State lưu tiểu sử
  const [website, setWebsite] = useState(""); // State lưu website
  const [photoURL, setPhotoURL] = useState(""); // State lưu URL ảnh đại diện
  const router = useRouter(); // Sử dụng router để điều hướng trang

  // Lấy dữ liệu người dùng từ Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login"); // Nếu người dùng chưa đăng nhập, chuyển hướng đến trang login
      } else {
        setUser(currentUser); // Cập nhật state với thông tin người dùng
        const userDoc = await getDoc(doc(db, "users", currentUser.uid)); // Lấy dữ liệu người dùng từ Firestore
        if (userDoc.exists()) {
          const data = userDoc.data();
          setFirstName(data.firstName || ""); // Cập nhật tên
          setLastName(data.lastName || ""); // Cập nhật họ
          setBio(data.bio || ""); // Cập nhật tiểu sử
          setWebsite(data.website || ""); // Cập nhật website
          setPhotoURL(data.photoURL || currentUser.photoURL || ""); // Cập nhật ảnh đại diện
        }
      }
    });

    return () => unsubscribe(); // Dọn dẹp khi component bị unmount
  }, [router]);

  // Xử lý cập nhật thông tin người dùng
  const handleSave = async () => {
    if (!user) return; // Nếu không có người dùng thì không làm gì
    try {
      await setDoc(doc(db, "users", user.uid), {
        firstName, // Cập nhật thông tin người dùng
        lastName,
        bio,
        website,
        photoURL,
        username: user.email?.split("@")[0], // Username không thay đổi
      });

      await updateProfile(user, { displayName: `${firstName} ${lastName}`, photoURL }); // Cập nhật displayName và photoURL

      alert("Cập nhật thành công!"); // Thông báo khi thành công
      router.push("/personal"); // Chuyển hướng về trang cá nhân
    } catch (error) {
      console.error("Lỗi cập nhật:", error); // Xử lý lỗi nếu có
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Chỉnh sửa hồ sơ</h1>
      <p className="text-gray-600 mb-4">Hãy giữ riêng tư thông tin cá nhân của bạn.</p>

      {/* Ảnh đại diện */}
      <div className="flex items-center mb-4">
        <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center text-2xl font-bold">
          {photoURL ? (
            <Image
              src={photoURL || "/default-avatar.png"} // Nếu không có ảnh, dùng ảnh mặc định
              alt="Avatar"
              width={80}
              height={80}
              className="rounded-full"
            />
          ) : (
            user?.displayName?.charAt(0) || "U" // Nếu không có ảnh, hiển thị chữ cái đầu tiên của tên
          )}
        </div>
        <button className="ml-4 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">
          Thay đổi
        </button>
      </div>

      {/* Nhập thông tin */}
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          placeholder="Tên"
          className="w-1/2 p-2 border rounded"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)} // Cập nhật state khi người dùng nhập tên
        />
        <input
          type="text"
          placeholder="Họ"
          className="w-1/2 p-2 border rounded"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)} // Cập nhật state khi người dùng nhập họ
        />
      </div>

      {/* Username (Không chỉnh sửa) */}
      <input
        type="text"
        className="w-full p-2 border rounded mb-4 bg-gray-100"
        value={user?.email?.split("@")[0] || ""} // Username lấy từ email, không cho phép chỉnh sửa
        readOnly
      />

      {/* Nút Lưu */}
      <div className="flex gap-4">
        <button
          onClick={handleSave} // Khi nhấn lưu, gọi hàm handleSave
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Lưu
        </button>
      </div>
    </div>
  );
};

export default EditProfile;
