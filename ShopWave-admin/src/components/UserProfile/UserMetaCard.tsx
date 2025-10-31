import type { User } from "../../services/authService";
// Removed i18n usage; hardcoded Vietnamese labels

type Props = { user?: User };

export default function UserMetaCard({ user }: Props) {
  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.fullName || user.email}
              className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full object-cover dark:border-gray-800"
            />
          ) : (
            <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800 bg-gray-200 dark:bg-gray-700" aria-hidden="true" />
          )}
          <div className="order-3 xl:order-2">
            <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
              {user?.fullName || user?.email || "Tên người dùng"}
            </h4>
            <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
              <p className="text-sm text-gray-500 dark:text-gray-400">{user?.role || "Vai trò"}</p>
              <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user ? "Quản trị" : "Vị trí"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
