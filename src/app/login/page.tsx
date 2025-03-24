"use client";

import { useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { useRouter } from "next/navigation";
import { auth, googleProvider, facebookProvider } from "@/lib/firebaseConfig";
import { setCookie } from "cookies-next";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  onAuthStateChanged,
  AuthProvider,
} from "firebase/auth";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa";

interface AuthFormInputs {
  email: string;
  password: string;
}

export default function AuthPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<AuthFormInputs>();
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [passwordValue, setPasswordValue] = useState<string>("");
  const router = useRouter();

  // Theo dõi trạng thái xác thực và chuyển hướng ngay khi đăng nhập
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Nếu có user (đã đăng nhập), chuyển hướng ngay lập tức
        router.push("/personal");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleRegister: SubmitHandler<AuthFormInputs> = async ({ email, password }) => {
    setLoading(true);
    setErrorMessage("");

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      setCookie("authToken", token, { maxAge: 86400 });
      // Không cần router.push ở đây vì onAuthStateChanged sẽ xử lý
    } catch (error) {
      setErrorMessage("Đăng ký thất bại. " + (error as Error).message);
      setLoading(false);
    }
  };

  const handleLogin: SubmitHandler<AuthFormInputs> = async ({ email, password }) => {
    setLoading(true);
    setErrorMessage("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      setCookie("authToken", token, { maxAge: 86400 });
      // Không cần router.push ở đây vì onAuthStateChanged sẽ xử lý
    } catch (error) {
      setErrorMessage("Đăng nhập thất bại. " + (error as Error).message);
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: AuthProvider) => {
    setLoading(true);
    setErrorMessage("");

    try {
      const result = await signInWithPopup(auth, provider);
      const token = await result.user.getIdToken();
      setCookie("authToken", token, { maxAge: 86400 });
      // Không cần router.push ở đây vì onAuthStateChanged sẽ xử lý
    } catch (error) {
      setErrorMessage("Đăng nhập thất bại. " + (error as Error).message);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm">
        <h2 className="text-2xl font-bold text-center text-gray-700 mb-4">
          {isRegistering ? "Đăng ký" : "Đăng nhập"}
        </h2>

        {errorMessage && <div className="text-red-500 text-sm text-center mb-3">{errorMessage}</div>}

        <form onSubmit={handleSubmit(isRegistering ? handleRegister : handleLogin)} className="space-y-3">
          <div>
            <input
              type="email"
              {...register("email", { required: "Vui lòng nhập email" })}
              placeholder="Email"
              className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-400"
            />
            {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
          </div>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              {...register("password", {
                required: "Vui lòng nhập mật khẩu",
                minLength: { value: 6, message: "Mật khẩu ít nhất 6 ký tự" },
              })}
              placeholder="Mật khẩu"
              value={passwordValue}
              onChange={(e) => setPasswordValue(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-400"
            />
            {passwordValue && (
              <button
                type="button"
                className="absolute top-2/4 right-4 transform -translate-y-2/4 text-gray-500 hover:text-gray-700"
                onClick={() => setShowPassword(!showPassword)}
              >
                {/* Thêm biểu tượng con mắt tại đây nếu cần */}
              </button>
            )}
            {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition disabled:bg-gray-400"
          >
            {loading ? (isRegistering ? "Đang đăng ký..." : "Đang đăng nhập...") : (isRegistering ? "Đăng ký" : "Đăng nhập")}
          </button>
        </form>

        <div className="mt-4 text-center text-gray-500 text-sm">Hoặc đăng nhập bằng</div>

        <div className="mt-3 flex flex-col space-y-2">
          <button
            onClick={() => handleSocialLogin(googleProvider)}
            className="w-full flex items-center justify-center bg-white border py-2 rounded-lg hover:bg-gray-100 transition"
          >
            <FcGoogle className="text-2xl mr-2" />
            Đăng nhập với Google
          </button>

          <button
            onClick={() => handleSocialLogin(facebookProvider)}
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
            onClick={() => setIsRegistering(!isRegistering)}
          >
            {isRegistering ? "Đăng nhập" : "Đăng ký"}
          </button>
        </div>
      </div>
    </div>
  );
}