"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebaseConfig";
import { User, onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import Image from "next/image";
import Link from "next/link";
import CollectionModal from "@/components/CollectionModal";
import ImageModal from "@/components/ImageModal";

interface UploadedImage {
  id: string;
  imageBase64: string;
  title: string;
  description: string;
  link: string;
  userId?: string;
  collectionId?: string;
  likes: string[]; // Thêm trường likes
  comments: { id: string; text: string; user: { id: string; name: string } }[]; // Thêm trường comments
}

interface ImageData {
  id: string;
  src: string;
  fullSrc: string;
  alt: string;
  userId?: string;
  collectionId?: string;
}

const ProfilePage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [avatar, setAvatar] = useState<string>("");
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [collections, setCollections] = useState<{ id: string; name: string; previewImage?: string }[]>([]);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [activeTab, setActiveTab] = useState<"saved" | "uploaded">("saved");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
      } else {
        setUser(currentUser);
        // Lấy dữ liệu user từ Firestore để lấy avatar, tên, và username
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setFirstName(data.firstName || "");
          setLastName(data.lastName || "");
          setUsername(data.username || currentUser.email?.split("@")[0] || "unknown");
          setAvatar(data.avatar || "");
        }
        fetchCollections(currentUser.uid);
        fetchUploadedImages(currentUser.uid);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const fetchCollections = async (userId: string) => {
    try {
      const q = query(collection(db, "users", userId, "collections"));
      const querySnapshot = await getDocs(q);
      const data = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
          const imagesRef = collection(db, "users", userId, "collections", doc.id, "images");
          const imagesSnapshot = await getDocs(imagesRef);

          const firstImage = imagesSnapshot.docs.length > 0 ? imagesSnapshot.docs[0].data().imageBase64 : null;

          return {
            id: doc.id,
            name: doc.data().name,
            previewImage: firstImage || undefined,
          };
        })
      );
      setCollections(data);
    } catch (error) {
      console.error("❌ Lỗi khi lấy bộ sưu tập:", error);
    }
  };

  const fetchUploadedImages = async (userId: string) => {
    try {
      const imageList: UploadedImage[] = [];
      console.log("🔍 Đang lấy ảnh từ publicUploads cho userId:", userId);
      const q = query(collection(db, "publicUploads"), where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      console.log("🔍 Số ảnh tìm thấy:", querySnapshot.size);

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        imageList.push({
          id: doc.id,
          imageBase64: data.imageBase64 || "",
          title: data.title,
          description: data.description || "",
          link: data.link || "",
          userId: data.userId || userId,
          collectionId: data.collectionId || "",
          likes: data.likes || [], // Lấy số lượt thích
          comments: data.comments || [], // Lấy danh sách bình luận
        });
      });

      setUploadedImages(imageList);
    } catch (error) {
      console.error("❌ Lỗi khi lấy ảnh đã tải lên:", error);
    }
  };

  const openImageModal = (image: UploadedImage) => {
    console.log("🔍 Mở ImageModal với Image ID:", image.id);
    const imageData: ImageData = {
      id: image.id,
      src: image.imageBase64,
      fullSrc: image.imageBase64,
      alt: image.title,
      userId: image.userId,
      collectionId: image.collectionId,
    };
    setSelectedImage(imageData);
    setIsImageModalOpen(true);
  };

  const closeImageModal = () => {
    setIsImageModalOpen(false);
    setSelectedImage(null);
  };

  const displayName = firstName && lastName ? `${firstName} ${lastName}` : "Người dùng ẩn danh";

  return (
    <div className="flex flex-col items-center min-h-screen bg-white p-6">
      <div className="text-center mb-6">
        <Link href={`/profile/${user?.uid}`}>
          <div className="w-24 h-24 mx-auto bg-gray-300 rounded-full flex items-center justify-center text-3xl font-bold overflow-hidden">
            {avatar ? (
              <Image
                src={avatar}
                alt="Avatar"
                width={96}
                height={96}
                className="w-full h-full object-cover"
              />
            ) : (
              displayName.charAt(0) || "U"
            )}
          </div>
        </Link>
        <Link href={`/profile/${user?.uid}`}>
          <h1 className="text-2xl font-bold mt-2 hover:underline">{displayName}</h1>
        </Link>
        <Link href={`/profile/${user?.uid}`}>
          <p className="text-gray-500 hover:underline">@{username}</p>
        </Link>
        <Link href="/edit-profile">
          <button className="mt-4 px-4 py-2 bg-gray-300 text-black rounded-full hover:bg-gray-400">
            Chỉnh sửa hồ sơ
          </button>
        </Link>
      </div>

      <div className="flex space-x-8 border-b pb-2 mb-4">
        <button
          className={`font-medium text-gray-600 pb-2 ${activeTab === "saved" ? "border-b-2 border-black" : ""}`}
          onClick={() => setActiveTab("saved")}
        >
          Đã lưu
        </button>
        <button
          className={`font-medium text-gray-600 pb-2 ${activeTab === "uploaded" ? "border-b-2 border-black" : ""}`}
          onClick={() => setActiveTab("uploaded")}
        >
          Tải lên
        </button>
      </div>

      <div className="w-full max-w-4xl">
        {activeTab === "saved" && (
          <>
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
              <button
                className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center text-3xl font-bold text-gray-500 hover:bg-gray-200 transition"
                onClick={() => setIsModalOpen(true)}
              >
                +
              </button>
            </div>
          </>
        )}

        {activeTab === "uploaded" && (
          <>
            <h2 className="text-lg font-semibold mb-4">🖼️ Ảnh đã tải lên</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {uploadedImages.length > 0 ? (
                uploadedImages.map((image) => (
                  <div
                    key={image.id}
                    className="relative bg-gray-100 rounded-lg p-2 shadow-md cursor-pointer"
                    onClick={() => openImageModal(image)}
                  >
                    <Image
                      src={image.imageBase64}
                      alt={image.title}
                      width={200}
                      height={200}
                      className="w-full h-32 object-cover rounded-md"
                    />
                    <p className="text-center mt-2 font-medium">{image.title}</p>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center text-gray-500">
                  Chưa có ảnh nào được tải lên.
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {isModalOpen && <CollectionModal onClose={() => setIsModalOpen(false)} />}
      {isImageModalOpen && selectedImage && (
        <ImageModal image={selectedImage} onClose={closeImageModal} />
      )}
    </div>
  );
};

export default ProfilePage;