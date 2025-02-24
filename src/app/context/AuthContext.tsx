import { createContext, useContext, useState, useEffect } from "react"; // Import các hook cần thiết của React
import { onAuthStateChanged, User } from "firebase/auth"; // Import Firebase auth và User interface
import { auth } from "@/lib/firebaseConfig"; // Import cấu hình auth từ firebaseConfig

// Định nghĩa kiểu dữ liệu cho AuthContext
interface AuthContextType {
  user: User | null; // Thông tin người dùng (hoặc null nếu chưa đăng nhập)
  loading: boolean; // Trạng thái tải (chưa xác định người dùng)
}

// Tạo context để cung cấp trạng thái người dùng trong ứng dụng
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider để bao bọc ứng dụng và cung cấp thông tin người dùng
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null); // Trạng thái lưu thông tin người dùng
  const [loading, setLoading] = useState(true); // Trạng thái tải (chưa xác định người dùng)

  // useEffect để lắng nghe sự thay đổi trạng thái người dùng
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser); // Cập nhật thông tin người dùng
      setLoading(false); // Đã xong việc xác định người dùng
    });

    // Dọn dẹp khi component bị unmount
    return () => unsubscribe();
  }, []); // useEffect chỉ chạy một lần khi component mount

  return (
    <AuthContext.Provider value={{ user, loading }}> 
      {/* Cung cấp context cho các component con */}
      {children}
    </AuthContext.Provider>
  );
};

// Hook để truy cập thông tin người dùng từ AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext); // Lấy giá trị context
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider"); 
    // Nếu context chưa được bao bọc bởi AuthProvider thì báo lỗi
  }
  return context; // Trả về thông tin người dùng và trạng thái loading
};
