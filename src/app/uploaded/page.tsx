"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { db } from "@/lib/firebaseConfig";
import { collection, getDocs, query, orderBy, startAfter, limit, Timestamp } from "firebase/firestore";
import MasonryGrid from "@/components/MasonryGrid";
import ImageModal from "@/components/ImageModal";

interface Comment {
    id: string;
    text: string;
    user: {
        id: string;
        name: string;
    };
}

interface ImageData {
    id: string;
    src: string;
    fullSrc: string;
    alt: string;
    userId?: string;
    collectionId?: string;
    likes?: string[];
    comments?: Comment[];
}

interface UploadedImage {
    id: string;
    imageBase64: string;
    title: string;
    description: string;
    link: string;
    createdAt: Timestamp;
    userId: string;
    collectionId?: string;
    likes: string[];
    comments: Comment[];
}

export default function UploadedPage() {
    const [uploadedImages, setUploadedImages] = useState<ImageData[]>([]);
    const [lastDoc, setLastDoc] = useState<Timestamp | null>(null);
    const [hasMoreUploaded, setHasMoreUploaded] = useState(true);
    const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const observerRef = useRef<HTMLDivElement | null>(null);

    const fetchUploadedImages = useCallback(
        async (lastDocument: Timestamp | null) => {
            if (!hasMoreUploaded || isLoading) return;

            setIsLoading(true);
            try {
                const firestoreQuery = lastDocument
                    ? query(
                        collection(db, "publicUploads"),
                        orderBy("createdAt", "desc"),
                        startAfter(lastDocument),
                        limit(10)
                    )
                    : query(
                        collection(db, "publicUploads"),
                        orderBy("createdAt", "desc"),
                        limit(10)
                    );

                const imageSnapshot = await getDocs(firestoreQuery);
                const imageList: UploadedImage[] = imageSnapshot.docs.map((doc) => {
                    const data = doc.data() as UploadedImage;
                    return {
                        id: doc.id,
                        imageBase64: data.imageBase64 || "",
                        title: data.title || "Không có tiêu đề",
                        description: data.description || "",
                        link: data.link || "",
                        createdAt: data.createdAt,
                        userId: data.userId || "unknown",
                        collectionId: data.collectionId || "",
                        likes: data.likes || [],
                        comments: data.comments || [],
                    };
                });

                const newImages: ImageData[] = imageList.map((img) => ({
                    id: img.id,
                    src: img.imageBase64,
                    fullSrc: img.imageBase64,
                    alt: img.title,
                    userId: img.userId,
                    collectionId: img.collectionId,
                    likes: img.likes,
                    comments: img.comments,
                }));

                setUploadedImages((prev) => {
                    const allImages = [...prev, ...newImages];
                    return Array.from(new Map(allImages.map((img) => [img.id, img])).values());
                });

                if (imageList.length > 0) {
                    setLastDoc(imageList[imageList.length - 1].createdAt);
                } else {
                    setHasMoreUploaded(false);
                }
            } catch (error) {
                console.error("❌ Lỗi khi lấy ảnh đã tải lên:", error);
            } finally {
                setIsLoading(false);
            }
        },
        [hasMoreUploaded, isLoading]
    );

    // Function to update the state with the modified image
    const refreshImageData = useCallback((updatedImage: ImageData) => {
        setUploadedImages((prev) =>
            prev.map((img) => (img.id === updatedImage.id ? updatedImage : img))
        );
    }, []);

    useEffect(() => {
        if (uploadedImages.length === 0) {
            fetchUploadedImages(null);
        }
    }, [fetchUploadedImages, uploadedImages.length]);

    useEffect(() => {
        if (!observerRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMoreUploaded) {
                    fetchUploadedImages(lastDoc);
                }
            },
            { rootMargin: "100px" }
        );

        observer.observe(observerRef.current);
        return () => observer.disconnect();
    }, [hasMoreUploaded, lastDoc, fetchUploadedImages]);

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            <h1 className="text-2xl font-bold mb-4">Tất cả ảnh công khai</h1>
            <MasonryGrid
                images={uploadedImages}
                onImageClick={(image) => setSelectedImage(image)}
            />
            {selectedImage && (
                <ImageModal
                    image={selectedImage}
                    onClose={() => setSelectedImage(null)}
                    onUpdate={refreshImageData} // Pass the callback to ImageModal
                />
            )}
            <div ref={observerRef} className="h-10">
                {hasMoreUploaded && <p className="text-center text-gray-500">Đang tải thêm...</p>}
                {!hasMoreUploaded && <p className="text-center text-gray-500">Đã tải hết ảnh.</p>}
            </div>
        </div>
    );
}