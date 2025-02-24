import { auth } from "@/lib/firebaseConfig";
import { deleteCookie } from "cookies-next";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await auth.signOut();
    deleteCookie("authToken"); // Xóa token
    router.push("/login"); // Quay về trang login
  };

  return <button onClick={handleLogout}>Đăng xuất</button>;
}
