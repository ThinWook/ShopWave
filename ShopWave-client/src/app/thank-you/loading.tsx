export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto p-6 animate-pulse">
      <div className="text-center mb-8">
        <div className="mx-auto h-16 w-16 rounded-full bg-green-100" />
        <div className="h-6 w-64 bg-gray-200 rounded mx-auto mt-4" />
        <div className="h-4 w-80 bg-gray-100 rounded mx-auto mt-2" />
      </div>

      <div className="p-6 border rounded-lg mb-6">
        <div className="h-5 w-48 bg-gray-200 rounded mb-4" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-4 items-center border-b pb-4 last:border-b-0">
              <div className="w-16 h-16 rounded-md bg-gray-200" />
              <div className="flex-grow space-y-2">
                <div className="h-4 w-60 bg-gray-200 rounded" />
                <div className="h-3 w-40 bg-gray-100 rounded" />
              </div>
              <div className="h-4 w-24 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 border rounded-lg space-y-2">
          <div className="h-5 w-56 bg-gray-200 rounded mb-2" />
          <div className="h-4 w-48 bg-gray-100 rounded" />
          <div className="h-4 w-32 bg-gray-100 rounded" />
          <div className="h-4 w-64 bg-gray-100 rounded" />
        </div>
        <div className="p-6 border rounded-lg space-y-2">
          <div className="h-5 w-56 bg-gray-200 rounded mb-2" />
          <div className="h-4 w-48 bg-gray-100 rounded" />
          <div className="h-4 w-40 bg-gray-100 rounded" />
          <div className="h-6 w-56 bg-gray-200 rounded" />
        </div>
      </div>

      <div className="text-center mt-10 space-x-4">
        <div className="inline-block h-10 w-40 bg-blue-200 rounded" />
        <div className="inline-block h-10 w-48 bg-blue-50 rounded" />
      </div>
    </div>
  );
}
