"use client";

import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import { db } from "@/lib/firebaseConfig";
import { doc, getDoc, updateDoc, collection, addDoc, getDocs, deleteDoc } from "firebase/firestore";
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

interface Reply {
  id: string;
  commentId: string;
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
  const [replies, setReplies] = useState<Reply[]>([]);
  const [totalComments, setTotalComments] = useState<number>(0);
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editedCommentText, setEditedCommentText] = useState("");
  const [uploaderName, setUploaderName] = useState<string>("");
  const [uploaderUsername, setUploaderUsername] = useState<string>("");
  const [uploaderAvatar, setUploaderAvatar] = useState<string>("");
  const [uploaderId, setUploaderId] = useState<string>("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [newReply, setNewReply] = useState("");
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editedReplyText, setEditedReplyText] = useState("");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

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
        setHasLiked(user ? likesArray.includes(user.uid) : false);
        setComments(commentsArray);

        const repliesRef = collection(db, `publicUploads/${image.id}/replies`);
        const repliesSnap = await getDocs(repliesRef);
        const repliesArray = repliesSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Reply[];
        setReplies(repliesArray);

        setTotalComments(commentsArray.length + repliesArray.length);

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
    } catch (error) {
      console.error("❌ Lỗi khi lấy dữ liệu ảnh:", error);
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
      if (!image?.id || !image?.userId) return;

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
      } catch (error) {
        console.error("❌ Lỗi khi cập nhật dữ liệu:", error);
      }
    },
    [image?.id, image?.userId, image?.collectionId, updateParent]
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
    setTotalComments(updatedComments.length + replies.length);
    setNewComment("");
    await updateBothDocuments(likes, updatedComments);
  };

  const handleReply = async (commentId: string) => {
    if (!user) return alert("Bạn cần đăng nhập để trả lời!");
    if (!newReply.trim() || !image?.id) return;

    const replyData: Reply = {
      id: uuidv4(),
      commentId,
      text: newReply,
      user: { id: user.uid, name: user.displayName || "Người dùng" },
    };

    const repliesRef = collection(db, `publicUploads/${image.id}/replies`);
    await addDoc(repliesRef, replyData);

    const updatedReplies = [...replies, replyData];
    setReplies(updatedReplies);
    setTotalComments(comments.length + updatedReplies.length);
    setNewReply("");
    setReplyingTo(null);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;
    if (!confirm("Bạn có chắc muốn xóa bình luận này?")) return;

    const updatedComments = comments.filter((comment) => comment.id !== commentId);
    setComments(updatedComments);

    const repliesToDelete = replies.filter((reply) => reply.commentId === commentId);
    for (const reply of repliesToDelete) {
      await deleteDoc(doc(db, `publicUploads/${image.id}/replies/${reply.id}`));
    }

    const updatedReplies = replies.filter((reply) => reply.commentId !== commentId);
    setReplies(updatedReplies);
    setTotalComments(updatedComments.length + updatedReplies.length);
    await updateBothDocuments(likes, updatedComments);
  };

  const handleEditComment = (comment: Comment) => {
    if (!user || user.uid !== comment.user.id) return;
    setEditingCommentId(comment.id);
    setEditedCommentText(comment.text);
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!user || !editedCommentText.trim()) return;

    const updatedComments = comments.map((comment) =>
      comment.id === commentId ? { ...comment, text: editedCommentText } : comment
    );
    setComments(updatedComments);
    setEditingCommentId(null);
    setEditedCommentText("");
    await updateBothDocuments(likes, updatedComments);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditedCommentText("");
  };

  const handleEditReply = (reply: Reply) => {
    if (!user || user.uid !== reply.user.id) return;
    setEditingReplyId(reply.id);
    setEditedReplyText(reply.text);
    setMenuOpen(null);
  };

  const handleSaveEditReply = async (replyId: string) => {
    if (!user || !editedReplyText.trim()) return;

    const updatedReply = replies.find((r) => r.id === replyId);
    if (!updatedReply) return;

    const replyRef = doc(db, `publicUploads/${image.id}/replies/${replyId}`);
    await updateDoc(replyRef, { text: editedReplyText });

    setReplies(replies.map((r) => (r.id === replyId ? { ...r, text: editedReplyText } : r)));
    setEditingReplyId(null);
    setEditedReplyText("");
  };

  const handleCancelEditReply = () => {
    setEditingReplyId(null);
    setEditedReplyText("");
  };

  const handleDeleteReply = async (replyId: string) => {
    if (!user) return;
    if (!confirm("Bạn có chắc muốn xóa câu trả lời này?")) return;

    await deleteDoc(doc(db, `publicUploads/${image.id}/replies/${replyId}`));
    const updatedReplies = replies.filter((r) => r.id !== replyId);
    setReplies(updatedReplies);
    setTotalComments(comments.length + updatedReplies.length);
    setMenuOpen(null);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(image?.fullSrc || "");
    alert("Link ảnh đã được sao chép!");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
      <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors z-10"
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

        <div className="absolute top-4 left-4 flex items-center space-x-3 z-10">
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

        <div className="flex justify-center p-6">
          <Image
            src={image?.fullSrc || ""}
            alt={image?.alt || "Hình ảnh"}
            width={600}
            height={400}
            className="rounded-lg object-contain max-w-full max-h-[500px]"
          />
        </div>

        <div className="px-6 pb-4 flex justify-between items-center border-t border-gray-200 pt-4">
          <div className="flex items-center space-x-4">
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
          </div>
          <button
            onClick={handleShare}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
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
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
            <span>Chia sẻ</span>
          </button>
        </div>

        <div className="px-6 pb-6">
          <h3 className="font-semibold text-lg mb-3">Bình luận</h3>
          {comments.length === 0 ? (
            <p className="text-gray-500 italic">Chưa có bình luận nào</p>
          ) : (
            <ul className="max-h-48 overflow-y-auto space-y-3">
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
                          <span className="font-semibold text-gray-800">{comment.user.name}</span>
                          <span className="text-gray-600 ml-2">{comment.text}</span>
                        </div>
                        {user && user.uid === comment.user.id && (
                          <div className="relative">
                            <button
                              onClick={() => setMenuOpen(menuOpen === comment.id ? null : comment.id)}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              ⋮
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

                      {user && (
                        <button
                          onClick={() => setReplyingTo(comment.id)}
                          className="text-blue-500 hover:text-blue-700 text-sm mt-1"
                        >
                          Trả lời
                        </button>
                      )}

                      {replies.filter((reply) => reply.commentId === comment.id).length > 0 && (
                        <ul className="ml-6 mt-2 space-y-2">
                          {replies
                            .filter((reply) => reply.commentId === comment.id)
                            .map((reply) => (
                              <li key={reply.id} className="text-sm flex justify-between items-start">
                                {editingReplyId === reply.id ? (
                                  <div className="w-full">
                                    <input
                                      type="text"
                                      value={editedReplyText}
                                      onChange={(e) => setEditedReplyText(e.target.value)}
                                      className="border rounded-lg px-3 py-1 w-full focus:outline-none focus:ring-2 focus:ring-blue-300"
                                    />
                                    <div className="mt-2 flex space-x-2">
                                      <button
                                        onClick={() => handleSaveEditReply(reply.id)}
                                        className="bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 transition-colors"
                                      >
                                        Lưu
                                      </button>
                                      <button
                                        onClick={handleCancelEditReply}
                                        className="bg-gray-400 text-white px-3 py-1 rounded-lg hover:bg-gray-500 transition-colors"
                                      >
                                        Hủy
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div>
                                      <span className="font-semibold text-gray-800">{reply.user.name}</span>
                                      <span className="text-gray-600 ml-2">{reply.text}</span>
                                    </div>
                                    {user && user.uid === reply.user.id && (
                                      <div className="relative">
                                        <button
                                          onClick={() =>
                                            setMenuOpen(menuOpen === reply.id ? null : reply.id)
                                          }
                                          className="text-gray-500 hover:text-gray-700"
                                        >
                                          ⋮
                                        </button>
                                        {menuOpen === reply.id && (
                                          <div className="absolute right-0 mt-2 w-24 bg-white border rounded-lg shadow-lg z-10">
                                            <button
                                              onClick={() => handleEditReply(reply)}
                                              className="block w-full text-left px-4 py-2 text-sm text-blue-500 hover:bg-gray-100"
                                            >
                                              Sửa
                                            </button>
                                            <button
                                              onClick={() => handleDeleteReply(reply.id)}
                                              className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-100"
                                            >
                                              Xóa
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </>
                                )}
                              </li>
                            ))}
                        </ul>
                      )}

                      {replyingTo === comment.id && (
                        <div className="mt-2 flex space-x-2">
                          <input
                            type="text"
                            value={newReply}
                            onChange={(e) => setNewReply(e.target.value)}
                            className="border rounded-lg px-3 py-1 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-300"
                            placeholder="Viết câu trả lời..."
                          />
                          <button
                            onClick={() => handleReply(comment.id)}
                            className="bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 transition-colors"
                          >
                            Gửi
                          </button>
                          <button
                            onClick={() => setReplyingTo(null)}
                            className="bg-gray-400 text-white px-3 py-1 rounded-lg hover:bg-gray-500 transition-colors"
                          >
                            Hủy
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="px-6 pb-6 border-t border-gray-200 pt-4">
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
  );
};

export default ImageModal;