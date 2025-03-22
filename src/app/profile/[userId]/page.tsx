"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { db } from "@/lib/firebaseConfig";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import Image from "next/image";
import ImageModal from "@/components/ImageModal";
import Link from "next/link";

interface Comment {
    id: string;
    text: string;
    user: { id: string; name: string };
    timestamp: string; // Thêm thời gian để sắp xếp bình luận
}

interface UploadedImage {
    id: string;
    imageBase64: string;
    title: string;
    description: string;
    link: string;
    userId?: string;
    collectionId?: string;
    comments: Comment[]; // Thêm trường comments
}

interface ImageData {
    id: string;
    src: string;
    fullSrc: string;
    alt: string;
    userId?: string;
    collectionId?: string;
    comments: Comment[]; // Thêm comments vào ImageData
}

const UserProfilePage = () => {
    const [userData, setUserData] = useState<{
        firstName: string;
        lastName: string;
        username: string;
        avatar: string;
    } | null>(null);
    const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
    const router = useRouter();
    const { userId } = useParams();

    useEffect(() => {
        if (!userId) return;

        const fetchUserData = async () => {
            try {
                const userRef = doc(db, "users", userId as string);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    const data = userSnap.data();
                    setUserData({
                        firstName: data.firstName || "",
                        lastName: data.lastName || "",
                        username: data.username || data.email?.split("@")[0] || "unknown",
                        avatar: data.avatar || "",
                    });
                } else {
                    router.push("/404");
                }
            } catch (error) {
                console.error("❌ Lỗi khi lấy thông tin người dùng:", error);
                router.push("/404");
            }
        };

        const fetchUploadedImages = async () => {
            try {
                const imageList: UploadedImage[] = [];
                const q = query(collection(db, "publicUploads"), where("userId", "==", userId));
                const querySnapshot = await getDocs(q);

                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    imageList.push({
                        id: doc.id,
                        imageBase64: data.imageBase64 || "",
                        title: data.title || "Không có tiêu đề",
                        description: data.description || "",
                        link: data.link || "",
                        userId: data.userId || userId,
                        collectionId: data.collectionId || "",
                        comments: data.comments || [], // Lấy danh sách bình luận từ Firestore
                    });
                });

                setUploadedImages(imageList);
            } catch (error) {
                console.error("❌ Lỗi khi lấy ảnh đã tải lên:", error);
            }
        };

        fetchUserData();
        fetchUploadedImages();
    }, [userId, router]);

    const openImageModal = (image: UploadedImage) => {
        const imageData: ImageData = {
            id: image.id,
            src: image.imageBase64,
            fullSrc: image.imageBase64,
            alt: image.title,
            userId: image.userId,
            collectionId: image.collectionId,
            comments: image.comments || [],
        };
        setSelectedImage(imageData);
        setIsImageModalOpen(true);
    };

    const closeImageModal = () => {
        setIsImageModalOpen(false);
        setSelectedImage(null);
    };

    if (!userData) {
        return <div className="text-center p-6">Đang tải...</div>;
    }

    const displayName = userData.firstName && userData.lastName ? `${userData.firstName} ${userData.lastName}` : "Người dùng ẩn danh";

    return (
        <div className="flex flex-col items-center min-h-screen bg-white p-6">
            <div className="text-center mb-6">
                <Link href={`/profile/${userId}`}>
                    <div className="w-24 h-24 mx-auto bg-gray-300 rounded-full flex items-center justify-center text-3xl font-bold overflow-hidden">
                        {userData.avatar ? (
                            <Image
                                src={userData.avatar}
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
                <Link href={`/profile/${userId}`}>
                    <h1 className="text-2xl font-bold mt-2 hover:underline">{displayName}</h1>
                </Link>
                <Link href={`/profile/${userId}`}>
                    <p className="text-gray-500 hover:underline">@{userData.username}</p>
                </Link>
            </div>

            <div className="w-full max-w-4xl">
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
            </div>

            {isImageModalOpen && selectedImage && (
                <ImageModal image={selectedImage} onClose={closeImageModal} />
            )}
        </div>
    );
};

export default UserProfilePage;