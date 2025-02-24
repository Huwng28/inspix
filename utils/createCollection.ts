import { db } from "@/lib/firebaseConfig"; // Đảm bảo đã config Firebase
import { collection, addDoc } from "firebase/firestore";

export const createCollection = async (userId: string, collectionName: string) => {
  try {
    const collectionsRef = collection(db, "users", userId, "collections");
    await addDoc(collectionsRef, {
      name: collectionName,
      images: [],
    });
    console.log("✅ Bộ sưu tập đã được tạo!");
  } catch (error) {
    console.error("❌ Lỗi khi tạo bộ sưu tập:", error);
  }
};
