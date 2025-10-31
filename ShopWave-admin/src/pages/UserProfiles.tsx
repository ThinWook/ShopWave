import PageBreadcrumb from "../components/common/PageBreadCrumb";
import UserMetaCard from "../components/UserProfile/UserMetaCard";
import UserInfoCard from "../components/UserProfile/UserInfoCard";
import UserAddressCard from "../components/UserProfile/UserAddressCard";
import PageMeta from "../components/common/PageMeta";
import { useAuth } from "../context/AuthContext";

export default function UserProfiles() {
  const { user } = useAuth();
  return (
    <>
      <PageMeta title={`Hồ sơ | Admin`} description="Hồ sơ" />
      <PageBreadcrumb pageTitle="Hồ sơ" />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">Hồ sơ</h3>
        <div className="space-y-6">
          <UserMetaCard user={user || undefined} />
          <UserInfoCard user={user || undefined} />
          <UserAddressCard user={user || undefined} />
        </div>
      </div>
    </>
  );
}
