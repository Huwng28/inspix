"use client";

import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import { db } from "@/lib/firebaseConfig";
import { doc, getDoc, updateDoc, deleteDoc, getDocs, collection } from "firebase/firestore";
import { useAuth } from "@/app/context/AuthContext";
import { v4 as uuidv4 } from "uuid";
import Link from "next/link";

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
  description?: string; // Thêm trường description
}

interface ImageModalProps {
  image: ImageData;
  onClose: () => void;
  onUpdate?: (updatedImage: ImageData) => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ image, onClose, onUpdate }) => {
  const { user } = useAuth();
  const [likes, setLikes] = useState<string[]>(image.likes || []);
  const [hasLiked, setHasLiked] = useState(false);
  const [comments, setComments] = useState<Comment[]>(image.comments || []);
  const [totalComments, setTotalComments] = useState<number>(0);
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editedCommentText, setEditedCommentText] = useState("");
  const [uploaderName, setUploaderName] = useState<string>("");
  const [uploaderUsername, setUploaderUsername] = useState<string>("");
  const [uploaderAvatar, setUploaderAvatar] = useState<string>("");
  const [uploaderId, setUploaderId] = useState<string>("");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [isImageMenuOpen, setIsImageMenuOpen] = useState(false);
  const [description, setDescription] = useState<string>(""); // Thêm state để lưu description

  const fetchImageData = useCallback(async () => {
    if (!image?.id) return;

    try {
      const publicImageRef = doc(db, `publicUploads/${image.id}`);
      const publicImageSnap = await getDoc(publicImageRef);

      if (publicImageSnap.exists()) {
        const data = publicImageSnap.data();
        const likesArray = data.likes || [];
        const commentsArray = data.comments || [];

        setLikes(likesArray);
        setHasLiked(user && user.uid ? likesArray.includes(user.uid) : false);
        setComments(commentsArray);
        setTotalComments(commentsArray.length);
        setDescription(data.description || "Không có mô tả."); // Lấy description từ Firestore

        if (image.userId) {
          const userRef = doc(db, `users/${image.userId}`);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            setUploaderName(
              userData.firstName && userData.lastName
                ? `${userData.firstName} ${userData.lastName}`
                : "Người dùng ẩn danh"
            );
            setUploaderUsername(userData.username || userData.email?.split("@")[0] || "unknown");
            setUploaderAvatar(userData.avatar || "");
            setUploaderId(image.userId);
          }
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Lỗi không xác định";
      console.error("❌ Lỗi khi lấy dữ liệu ảnh:", errorMessage);
      alert("Không thể tải dữ liệu ảnh. Vui lòng thử lại!");
    }
  }, [image?.id, image?.userId, user]);

  useEffect(() => {
    fetchImageData();
  }, [fetchImageData]);

  const updateParent = useCallback(() => {
    if (onUpdate) {
      onUpdate({
        ...image,
        likes,
        comments,
      });
    }
  }, [onUpdate, image, likes, comments]);

  const updateBothDocuments = useCallback(
    async (updatedLikes: string[], updatedComments: Comment[]) => {
      if (!image?.id || !image?.userId) {
        console.error("Missing image data:", { id: image?.id, userId: image?.userId });
        return;
      }

      try {
        const publicImageRef = doc(db, `publicUploads/${image.id}`);
        await updateDoc(publicImageRef, { likes: updatedLikes, comments: updatedComments });

        if (image.collectionId) {
          const userImageRef = doc(
            db,
            `users/${image.userId}/collections/${image.collectionId}/images/${image.id}`
          );
          await updateDoc(userImageRef, { likes: updatedLikes, comments: updatedComments });
        }

        updateParent();
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Lỗi không xác định";
        console.error("❌ Lỗi khi cập nhật dữ liệu:", errorMessage);
        alert(`Không thể cập nhật dữ liệu: ${errorMessage}`);
        await fetchImageData();
      }
    },
    [image?.id, image?.userId, image?.collectionId, updateParent, fetchImageData]
  );

  const handleLike = async () => {
    if (!user) return alert("Bạn cần đăng nhập để thích ảnh!");
    if (!image?.id) return;

    let updatedLikes = [...likes];
    if (hasLiked) {
      updatedLikes = updatedLikes.filter((userId) => userId !== user.uid);
    } else {
      updatedLikes.push(user.uid);
    }

    setLikes(updatedLikes);
    setHasLiked(!hasLiked);
    await updateBothDocuments(updatedLikes, comments);
  };

  const handleComment = async () => {
    if (!user) return alert("Bạn cần đăng nhập để bình luận!");
    if (!newComment.trim() || !image?.id) return;

    const newCommentData: Comment = {
      id: uuidv4(),
      text: newComment,
      user: { id: user.uid, name: user.displayName || "Người dùng" },
    };

    const updatedComments = [...comments, newCommentData];
    setComments(updatedComments);
    setTotalComments(updatedComments.length);
    setNewComment("");
    await updateBothDocuments(likes, updatedComments);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user || !user.uid) return alert("Bạn cần đăng nhập để xóa bình luận!");
    if (!image?.id || !image?.userId) return alert("Dữ liệu ảnh không hợp lệ!");

    const comment = comments.find((c) => c.id === commentId);
    if (!comment || !comment.user?.id) return alert("Không tìm thấy bình luận để xóa!");

    if (comment.user.id !== user.uid && image.userId !== user.uid) {
      alert("Bạn không có quyền xóa bình luận này!");
      return;
    }

    if (!confirm("Bạn có chắc muốn xóa bình luận này?")) return;

    try {
      const updatedComments = comments.filter((c) => c.id !== commentId);
      setComments(updatedComments);
      setTotalComments(updatedComments.length);
      await updateBothDocuments(likes, updatedComments);
      await fetchImageData();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Lỗi không xác định";
      console.error("❌ Lỗi khi xóa bình luận:", errorMessage);
      alert(`Không thể xóa bình luận: ${errorMessage}`);
      await fetchImageData();
    }
  };

  const handleDeleteImage = async () => {
    if (!user || !user.uid) return alert("Bạn cần đăng nhập để xóa ảnh!");
    if (!image?.id || !image?.userId) return alert("Dữ liệu ảnh không hợp lệ!");

    if (user.uid !== image.userId) {
      alert("Bạn không có quyền xóa ảnh này!");
      return;
    }

    if (!confirm("Bạn có chắc muốn xóa ảnh này?")) return;

    try {
      const repliesRef = collection(db, `publicUploads/${image.id}/replies`);
      const repliesSnap = await getDocs(repliesRef);
      const deleteRepliesPromises = repliesSnap.docs.map((replyDoc) =>
        deleteDoc(doc(db, `publicUploads/${image.id}/replies/${replyDoc.id}`))
      );
      await Promise.all(deleteRepliesPromises);

      const publicImageRef = doc(db, `publicUploads/${image.id}`);
      await deleteDoc(publicImageRef);

      if (image.collectionId) {
        const userImageRef = doc(
          db,
          `users/${image.userId}/collections/${image.collectionId}/images/${image.id}`
        );
        await deleteDoc(userImageRef);
      }

      alert("Ảnh đã được xóa thành công!");
      window.location.reload();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Lỗi không xác định";
      console.error("❌ Lỗi khi xóa ảnh:", errorMessage);
      alert(`Không thể xóa ảnh: ${errorMessage}`);
    }
  };

  const handleEditComment = (comment: Comment) => {
    if (!user || (user.uid !== comment.user.id && user.uid !== image.userId)) {
      alert("Bạn không có quyền sửa bình luận này!");
      return;
    }
    setEditingCommentId(comment.id);
    setEditedCommentText(comment.text);
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!user || !editedCommentText.trim() || !image?.id) return;

    const comment = comments.find((c) => c.id === commentId);
    if (!comment || (user.uid !== comment.user.id && user.uid !== image.userId)) {
      alert("Bạn không có quyền sửa bình luận này!");
      return;
    }

    const updatedComments = comments.map((c) =>
      c.id === commentId ? { ...c, text: editedCommentText } : c
    );
    setComments(updatedComments);
    setEditingCommentId(null);
    setEditedCommentText("");
    await updateBothDocuments(likes, updatedComments);
    await fetchImageData();
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditedCommentText("");
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = image?.fullSrc || "";
    link.download = image?.alt || "image";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="absolute top-4 right-4 flex items-center space-x-2 z-10">
          {user && user.uid === image.userId && (
            <div className="relative">
              <button
                onClick={() => setIsImageMenuOpen(!isImageMenuOpen)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 12h.01M12 12h.01M18 12h.01"
                  />
                </svg>
              </button>
              {isImageMenuOpen && (
                <div className="absolute right-0 mt-2 w-24 bg-white border rounded-lg shadow-lg z-20">
                  <button
                    onClick={handleDeleteImage}
                    className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-100"
                  >
                    Xóa ảnh
                  </button>
                </div>
              )}
            </div>
          )}
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col md:flex-row h-full overflow-y-auto">
          <div className="md:w-2/3 w-full bg-gray-100 flex items-center justify-center p-6">
            <div className="relative w-full h-full max-h-[70vh] flex items-center justify-center">
              <Image
                src={image?.fullSrc || ""}
                alt={image?.alt || "Hình ảnh"}
                width={0}
                height={0}
                sizes="100vw"
                className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
                priority
              />
            </div>
          </div>

          <div className="md:w-1/3 w-full bg-white p-6 flex flex-col">
            <div className="flex items-center space-x-3 mb-4">
              <Link href={`/profile/${uploaderId}`}>
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-xl font-bold overflow-hidden">
                  {uploaderAvatar ? (
                    <Image
                      src={uploaderAvatar}
                      alt="Avatar"
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    uploaderName.charAt(0) || "U"
                  )}
                </div>
              </Link>
              <div className="flex flex-col">
                <Link href={`/profile/${uploaderId}`}>
                  <span className="font-semibold text-gray-800 hover:underline">
                    {uploaderName || "Đang tải..."}
                  </span>
                </Link>
                <Link href={`/profile/${uploaderId}`}>
                  <span className="text-gray-500 text-sm hover:underline">
                    @{uploaderUsername || "unknown"}
                  </span>
                </Link>
              </div>
            </div>

            <p className="text-gray-600 mb-4">{description}</p> {/* Hiển thị mô tả ảnh */}

            <div className="flex items-center space-x-4 mb-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleLike}
                  className={`text-2xl transition-transform transform hover:scale-110 ${hasLiked ? "text-red-500" : "text-gray-400"}`}
                >
                  {hasLiked ? "❤️" : "🤍"}
                </button>
                <span className="text-gray-600 font-medium">{likes.length}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">💬</span>
                <span className="text-gray-600 font-medium">{totalComments}</span>
              </div>
              <button
                onClick={handleDownload}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                <span>Tải ảnh</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto mb-4">
              <h3 className="font-semibold text-lg mb-3">Bình luận</h3>
              {comments.length === 0 ? (
                <p className="text-gray-500 italic">Chưa có bình luận nào</p>
              ) : (
                <ul className="space-y-3">
                  {comments.map((comment) => (
                    <li key={comment.id} className="bg-gray-50 p-3 rounded-lg">
                      {editingCommentId === comment.id ? (
                        <div className="w-full">
                          <input
                            type="text"
                            value={editedCommentText}
                            onChange={(e) => setEditedCommentText(e.target.value)}
                            className="border rounded-lg px-3 py-1 w-full focus:outline-none focus:ring-2 focus:ring-blue-300"
                          />
                          <div className="mt-2 flex space-x-2">
                            <button
                              onClick={() => handleSaveEdit(comment.id)}
                              className="bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 transition-colors"
                            >
                              Lưu
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="bg-gray-400 text-white px-3 py-1 rounded-lg hover:bg-gray-500 transition-colors"
                            >
                              Hủy
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex justify-between items-start">
                            <div>
                              <Link href={`/profile/${comment.user.id}`}>
                                <span className="font-semibold text-gray-800 hover:underline">{comment.user.name}</span>
                              </Link>
                              <span className="text-gray-600 ml-2">{comment.text}</span>
                            </div>
                            {user && (user.uid === comment.user.id || user.uid === image.userId) && (
                              <div className="relative">
                                <button
                                  onClick={() => setMenuOpen(menuOpen === comment.id ? null : comment.id)}
                                  className="text-gray-500 hover:text-gray-700"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M6 12h.01M12 12h.01M18 12h.01"
                                    />
                                  </svg>
                                </button>
                                {menuOpen === comment.id && (
                                  <div className="absolute right-0 mt-2 w-24 bg-white border rounded-lg shadow-lg z-10">
                                    <button
                                      onClick={() => handleEditComment(comment)}
                                      className="block w-full text-left px-4 py-2 text-sm text-blue-500 hover:bg-gray-100"
                                    >
                                      Sửa
                                    </button>
                                    <button
                                      onClick={() => handleDeleteComment(comment.id)}
                                      className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-100"
                                    >
                                      Xóa
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border-t border-gray-200 pt-4">
              {user ? (
                <div className="flex space-x-3">
                  <input
                    type="text"
                    className="border rounded-lg px-4 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    placeholder="Viết bình luận của bạn..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <button
                    onClick={handleComment}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Gửi
                  </button>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Đăng nhập để bình luận</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageModal;