import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";

export default function Chats() {
  return (
    <>
      <PageMeta title={`Tin nhắn | Admin`} description="Tin nhắn" />
  <PageBreadcrumb pageTitle="Tin nhắn" hideTitle />

      <div className="h-[calc(100vh-150px)] overflow-hidden sm:h-[calc(100vh-174px)]">
        <div className="flex flex-col h-full gap-6 xl:flex-row xl:gap-5">
          {/* Left sidebar */}
          <div className="flex-col rounded-2xl border border-gray-200 bg-white dark:border-white/[0.03] dark:bg-gray-900 xl:flex xl:w-1/4">
            <div className="sticky px-4 pt-4 pb-4 sm:px-5 sm:pt-5 xl:pb-0">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800 text-theme-xl dark:text-white/90 sm:text-2xl">
                    Tin nhắn
                  </h3>
                </div>
                <div className="relative inline-block">
                  <button className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                    •••
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-4">
                <button className="flex items-center justify-center w-full text-gray-700 border border-gray-300 rounded-lg h-11 max-w-11 dark:border-gray-700 dark:text-gray-400 xl:hidden">
                  ≡
                </button>
                <div className="relative w-full my-2">
                  <form>
                    <button className="absolute -translate-y-1/2 left-4 top-1/2">
                      🔍
                    </button>
                    <input
                      placeholder="Tìm kiếm..."
                      className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pl-[42px] pr-3.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                      type="text"
                    />
                  </form>
                </div>
              </div>
            </div>
            {/* Chat list placeholder */}
            <div className="flex-col overflow-auto no-scrollbar transition-all duration-300 hidden xl:flex">
              <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800 xl:hidden">
                <div>
                  <h3 className="font-semibold text-gray-800 text-theme-xl dark:text-white/90 sm:text-2xl">
                    Trò chuyện
                  </h3>
                </div>
              </div>
              <div className="flex flex-col max-h-full px-4 overflow-auto sm:px-5">
                {/* Replace with mapped chat list items later */}
                <div className="text-sm text-gray-500 dark:text-gray-400 py-4">Danh sách trò chuyện gần đây</div>
              </div>
            </div>
          </div>

          {/* Right chat panel */}
          <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/[0.03] dark:bg-gray-900 xl:w-3/4">
            <div className="sticky flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800 xl:px-6">
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-full max-w-[48px] rounded-full bg-gray-200 dark:bg-gray-700" />
                <h5 className="text-sm font-medium text-gray-500 dark:text-gray-400">Chưa chọn cuộc trò chuyện</h5>
              </div>
            </div>

            <div className="flex-1 max-h-full p-5 space-y-6 overflow-auto custom-scrollbar xl:space-y-8 xl:p-6">
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">Chưa có tin nhắn</div>
            </div>

            <div className="sticky bottom-0 p-3 border-t border-gray-200 dark:border-gray-800">
              <form className="flex items-center justify-between">
                <div className="relative w-full">
                  <button className="absolute text-gray-500 -translate-y-1/2 left-1 top-1/2 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90 sm:left-3" aria-label="emoji">
                    🙂
                  </button>
                  <input
                    placeholder="Nhập tin nhắn"
                    className="w-full pl-12 pr-5 text-sm text-gray-800 bg-transparent border-none outline-hidden h-9 placeholder:text-gray-400 focus:border-0 focus:ring-0 dark:text-white/90"
                    type="text"
                    disabled
                  />
                </div>
                <div className="flex items-center">
                  <button className="flex items-center justify-center ml-3 text-white rounded-lg h-9 w-9 bg-brand-500 hover:bg-brand-600 xl:ml-5" aria-label="send">
                    ➤
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
