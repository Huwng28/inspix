"use client";

import { useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { useRouter } from "next/navigation"; // ✅ Dùng next/router cho Pages Router
import { auth, googleProvider, facebookProvider } from "@/lib/firebaseConfig"; // Import Firebase và các provider
import { setCookie } from "cookies-next"; // Lưu token vào cookie
import {
  createUserWithEmailAndPassword, // Đăng ký tài khoản mới
  signInWithEmailAndPassword, // Đăng nhập với email và mật khẩu
  signInWithPopup, // Đăng nhập với popup (Google/Facebook)
  onAuthStateChanged, // Theo dõi trạng thái đăng nhập của người dùng
  AuthProvider, // Loại cho provider (Google/Facebook)
} from "firebase/auth";
import { FcGoogle } from "react-icons/fc"; // Biểu tượng Google
import { FaFacebook } from "react-icons/fa"; // Biểu tượng Facebook

// Định nghĩa kiểu dữ liệu form
interface AuthFormInputs {
  email: string; // Email người dùng
  password: string; // Mật khẩu người dùng
}

export default function AuthPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<AuthFormInputs>(); // Sử dụng react-hook-form
  const [loading, setLoading] = useState<boolean>(false); // Quản lý trạng thái đang tải
  const [errorMessage, setErrorMessage] = useState<string>(""); // Lưu thông báo lỗi
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false); // Quản lý trạng thái đăng nhập
  const [isRegistering, setIsRegistering] = useState<boolean>(false); // Kiểm tra xem có phải đang đăng ký hay không
  const [showPassword, setShowPassword] = useState<boolean>(false); // Điều khiển hiển thị mật khẩu
  const [passwordValue, setPasswordValue] = useState<string>(""); // Lưu giá trị mật khẩu người dùng
  const router = useRouter(); // Dùng Router để điều hướng trong Next.js

  // Kiểm tra trạng thái đăng nhập của người dùng
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user); // Nếu người dùng có đăng nhập, setIsLoggedIn = true
    });

    return () => unsubscribe(); // Dọn dẹp khi component bị unmount
  }, []);

  // Điều hướng người dùng đến trang cá nhân nếu đã đăng nhập
  useEffect(() => {
    if (isLoggedIn) {
      router.push("/personal"); // Chuyển hướng đến trang cá nhân khi đã đăng nhập
    }
  }, [isLoggedIn, router]);

  // Xử lý đăng ký tài khoản
  const handleRegister: SubmitHandler<AuthFormInputs> = async ({ email, password }) => {
    setLoading(true); // Đặt trạng thái loading là true khi đang xử lý
    setErrorMessage(""); // Reset thông báo lỗi

    try {
      // Đăng ký người dùng mới với email và mật khẩu
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken(); // Lấy token của người dùng
      setCookie("authToken", token, { maxAge: 86400 }); // Lưu token vào cookie
      router.push("/personal"); // Chuyển hướng đến trang cá nhân
    } catch (error) {
      setErrorMessage("Đăng ký thất bại. " + (error as Error).message); // Hiển thị thông báo lỗi nếu có
    } finally {
      setLoading(false); // Đặt trạng thái loading lại là false
    }
  };

  // Xử lý đăng nhập tài khoản
  const handleLogin: SubmitHandler<AuthFormInputs> = async ({ email, password }) => {
    setLoading(true); // Đặt trạng thái loading là true khi đang xử lý
    setErrorMessage(""); // Reset thông báo lỗi

    try {
      // Đăng nhập với email và mật khẩu
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken(); // Lấy token của người dùng
      setCookie("authToken", token, { maxAge: 86400 }); // Lưu token vào cookie
      router.push("/personal"); // Chuyển hướng đến trang cá nhân
    } catch (error) {
      setErrorMessage("Đăng nhập thất bại. " + (error as Error).message); // Hiển thị thông báo lỗi nếu có
    } finally {
      setLoading(false); // Đặt trạng thái loading lại là false
    }
  };

  // Hàm xử lý đăng nhập bằng Google hoặc Facebook
  const handleSocialLogin = async (provider: AuthProvider) => {
    setLoading(true); // Đặt trạng thái loading là true khi đang xử lý
    setErrorMessage(""); // Reset thông báo lỗi

    try {
      // Đăng nhập bằng popup với provider (Google/Facebook)
      const result = await signInWithPopup(auth, provider);
      const token = await result.user.getIdToken(); // Lấy token của người dùng
      setCookie("authToken", token, { maxAge: 86400 }); // Lưu token vào cookie
      router.push("/personal"); // Chuyển hướng đến trang cá nhân
    } catch (error) {
      setErrorMessage("Đăng nhập thất bại. " + (error as Error).message); // Hiển thị thông báo lỗi nếu có
    } finally {
      setLoading(false); // Đặt trạng thái loading lại là false
    }
  };

  // Nếu người dùng đã đăng nhập, chuyển hướng đến trang cá nhân
  if (isLoggedIn) {
    return <div>Đã đăng nhập, chuyển đến trang cá nhân...</div>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm">
        <h2 className="text-2xl font-bold text-center text-gray-700 mb-4">
          {isRegistering ? "Đăng ký" : "Đăng nhập"} {/* Chuyển đổi giữa đăng nhập và đăng ký */}
        </h2>

        {errorMessage && <div className="text-red-500 text-sm text-center mb-3">{errorMessage}</div>} {/* Hiển thị thông báo lỗi */}

        <form onSubmit={handleSubmit(isRegistering ? handleRegister : handleLogin)} className="space-y-3">
          <div>
            <input
              type="email"
              {...register("email", { required: "Vui lòng nhập email" })}
              placeholder="Email"
              className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-400"
            />
            {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>} {/* Hiển thị lỗi email nếu có */}
          </div>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"} // Nếu showPassword = true, hiển thị mật khẩu, nếu không ẩn mật khẩu
              {...register("password", {
                required: "Vui lòng nhập mật khẩu",
                minLength: { value: 6, message: "Mật khẩu ít nhất 6 ký tự" },
              })}
              placeholder="Mật khẩu"
              value={passwordValue}
              onChange={(e) => setPasswordValue(e.target.value)} // Lưu giá trị mật khẩu
              className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-400"
            />
            {passwordValue && ( // Nếu có giá trị mật khẩu, hiển thị biểu tượng con mắt
              <button
                type="button"
                className="absolute top-2/4 right-4 transform -translate-y-2/4 text-gray-500 hover:text-gray-700"
                onClick={() => setShowPassword(!showPassword)} // Toggle hiển thị mật khẩu
              >
                {/* Biểu tượng con mắt */}
              </button>
            )}
            {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>} {/* Hiển thị lỗi mật khẩu nếu có */}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition disabled:bg-gray-400"
          >
            {loading ? (isRegistering ? "Đang đăng ký..." : "Đang đăng nhập...") : (isRegistering ? "Đăng ký" : "Đăng nhập")}
          </button> {/* Nút gửi form */}
        </form>

        <div className="mt-4 text-center text-gray-500 text-sm">Hoặc đăng nhập bằng</div> {/* Hoặc đăng nhập bằng social */}

        <div className="mt-3 flex flex-col space-y-2">
          <button
            onClick={() => handleSocialLogin(googleProvider)} // Đăng nhập với Google
            className="w-full flex items-center justify-center bg-white border py-2 rounded-lg hover:bg-gray-100 transition"
          >
            <FcGoogle className="text-2xl mr-2" />
            Đăng nhập với Google
          </button>

          <button
            onClick={() => handleSocialLogin(facebookProvider)} // Đăng nhập với Facebook
            className="w-full flex items-center justify-center bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <FaFacebook className="text-2xl mr-2" />
            Đăng nhập với Facebook
          </button>
        </div>

        <div className="mt-4 text-center text-sm">
          {isRegistering ? "Đã có tài khoản?" : "Chưa có tài khoản?"}
          <button
            className="text-blue-500 hover:underline ml-1"
            onClick={() => setIsRegistering(!isRegistering)} // Chuyển đổi giữa đăng nhập và đăng ký
          >
            {isRegistering ? "Đăng nhập" : "Đăng ký"}
          </button>
        </div>
      </div>
    </div>
  );
}
