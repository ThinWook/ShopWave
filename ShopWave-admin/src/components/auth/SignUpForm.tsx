import { useState } from "react";
import { Link } from "react-router";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";

export default function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  return (
    <div className="flex flex-col flex-1 w-full overflow-y-auto lg:w-1/2 no-scrollbar">
      {/* Removed Back to dashboard link as requested */}
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">Đăng ký</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Nhập email và mật khẩu để đăng ký!</p>
          </div>
          <div>
            {/* Đã xóa nút đăng nhập với Google theo yêu cầu */}
            {/* Đã xóa khối chia cách 'Hoặc' theo yêu cầu */}
            <form>
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {/* <!-- First Name --> */}
                  <div className="sm:col-span-1">
                    <Label>Họ <span className="text-error-500">*</span></Label>
                    <Input
                      type="text"
                      id="fname"
                      name="fname"
                      placeholder={"Nhập họ của bạn"}
                    />
                  </div>
                  {/* <!-- Last Name --> */}
                  <div className="sm:col-span-1">
                    <Label>Tên <span className="text-error-500">*</span></Label>
                    <Input
                      type="text"
                      id="lname"
                      name="lname"
                      placeholder={"Nhập tên của bạn"}
                    />
                  </div>
                </div>
                {/* <!-- Email --> */}
                <div>
                  <Label>Email<span className="text-error-500">*</span></Label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    placeholder={"Nhập email của bạn"}
                  />
                </div>
                {/* <!-- Password --> */}
                <div>
                  <Label>Mật khẩu<span className="text-error-500">*</span></Label>
                  <div className="relative">
                    <Input
                      placeholder={"Nhập mật khẩu của bạn"}
                      type={showPassword ? "text" : "password"}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </span>
                  </div>
                </div>
                {/* <!-- Checkbox --> */}
                <div className="flex items-center gap-3">
                  <Checkbox
                    className="w-5 h-5"
                    checked={isChecked}
                    onChange={setIsChecked}
                  />
                  <p className="inline-block font-normal text-gray-500 dark:text-gray-400">
                    Việc tạo tài khoản đồng nghĩa bạn đồng ý với <span className="text-gray-800 dark:text-white/90">Điều khoản & Điều kiện,</span> và <span className="text-gray-800 dark:text-white">Chính sách bảo mật</span>
                  </p>
                </div>
                {/* <!-- Button --> */}
                <div>
                  <button className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600">
                    Đăng ký
                  </button>
                </div>
              </div>
            </form>

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Đã có tài khoản?
                <Link
                  to="/signin"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Đăng nhập
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
