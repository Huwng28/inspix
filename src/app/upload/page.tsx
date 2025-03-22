"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { useAuth } from "../context/AuthContext";

const UploadPage = () => {
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [link, setLink] = useState("");
    const [progress, setProgress] = useState(0);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    const MAX_FILE_SIZE = 750 * 1024;

    const handleFileChange = (selectedFile: File | null) => {
        if (selectedFile) {
            if (selectedFile.size > MAX_FILE_SIZE) {
                alert("File quá lớn! Vui lòng chọn file nhỏ hơn 750 KB.");
                return;
            }
            setFile(selectedFile);
            const url = URL.createObjectURL(selectedFile);
            setPreviewUrl(url);
        } else {
            setFile(null);
            setPreviewUrl(null);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        handleFileChange(e.dataTransfer.files[0]);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleUpload = async () => {
        if (!file || !user) return alert("Bạn cần đăng nhập và chọn một file!");

        setLoading(true);
        setProgress(0);

        try {
            const interval = setInterval(() => {
                setProgress((prev) => (prev >= 90 ? prev : prev + 10));
            }, 200);

            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                clearInterval(interval);
                setProgress(100);

                const base64String = reader.result as string;

                await addDoc(collection(db, "publicUploads"), {
                    imageBase64: base64String,
                    title: title || "Không có tiêu đề",
                    description: description || "Không có mô tả",
                    link: link || "",
                    createdAt: Timestamp.fromDate(new Date()),
                    userId: user.uid,
                    likes: [],
                    comments: [],
                });

                alert("Tải ảnh lên thành công!");
                setFile(null);
                setPreviewUrl(null);
                setTitle("");
                setDescription("");
                setLink("");
                setLoading(false);
                setProgress(0);
            };
            reader.onerror = (error) => {
                console.error("Lỗi khi đọc file:", error);
                setLoading(false);
                setProgress(0);
            };
        } catch (error) {
            console.error("Lỗi khi lưu ảnh vào Firestore:", error);
            setLoading(false);
            setProgress(0);
        }
    };

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    return (
        <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
            <h1 style={{ fontSize: "24px", marginBottom: "20px" }}>Tải ảnh lên</h1>

            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                style={{
                    border: "2px dashed #ccc",
                    borderRadius: "8px",
                    padding: "20px",
                    textAlign: "center",
                    backgroundColor: "#f9f9f9",
                    marginBottom: "20px",
                    height: "200px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    position: "relative",
                }}
            >
                {previewUrl ? (
                    <div style={{ position: "relative", width: "100%", height: "100%" }}>
                        <Image
                            src={previewUrl}
                            alt="Preview"
                            fill
                            style={{ objectFit: "cover", borderRadius: "8px", opacity: 0.5 }}
                            unoptimized
                        />
                    </div>
                ) : (
                    <>
                        <p style={{ fontSize: "16px", marginBottom: "10px" }}>
                            Chọn một file hoặc kéo và thả vào đây
                        </p>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                            style={{ display: "block", margin: "0 auto" }}
                        />
                    </>
                )}
            </div>

            <div style={{ marginBottom: "20px" }}>
                <input
                    type="text"
                    placeholder="Thêm tiêu đề"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "8px",
                        border: "1px solid #ccc",
                        marginBottom: "10px",
                    }}
                />
                <textarea
                    placeholder="Thêm mô tả chi tiết"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "8px",
                        border: "1px solid #ccc",
                        marginBottom: "10px",
                        minHeight: "80px",
                    }}
                />
            </div>

            <button
                onClick={handleUpload}
                disabled={loading}
                style={{
                    width: "100%",
                    padding: "10px",
                    backgroundColor: loading ? "#ccc" : "#007bff",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    cursor: loading ? "not-allowed" : "pointer",
                }}
            >
                {loading ? `Đang tải... ${Math.round(progress)}%` : "Tải ảnh lên"}
            </button>
        </div>
    );
};

export default UploadPage;
