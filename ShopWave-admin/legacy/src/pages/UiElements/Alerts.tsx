import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard.tsx";
import Alert from "../../components/ui/alert/Alert.tsx";
import PageMeta from "../../components/common/PageMeta";

export default function Alerts() {
  return (
    <>
      <PageMeta title={`Cảnh báo | Bảng điều khiển Admin`} description="Trình diễn các loại cảnh báo." />
      <PageBreadcrumb pageTitle="Cảnh báo" />
      <div className="space-y-5 sm:space-y-6">
        <ComponentCard title="Cảnh báo thành công">
          <Alert
            variant="success"
            title="Tin nhắn thành công"
            message="Hãy cẩn trọng khi thực hiện hành động này."
            showLink={true}
            linkHref="/"
            linkText="Tìm hiểu thêm"
          />
          <Alert
            variant="success"
            title="Tin nhắn thành công"
            message="Hãy cẩn trọng khi thực hiện hành động này."
            showLink={false}
          />
        </ComponentCard>
        <ComponentCard title="Cảnh báo">
          <Alert
            variant="warning"
            title="Tin nhắn cảnh báo"
            message="Hãy cẩn trọng khi thực hiện hành động này."
            showLink={true}
            linkHref="/"
            linkText="Tìm hiểu thêm"
          />
          <Alert
            variant="warning"
            title="Tin nhắn cảnh báo"
            message="Hãy cẩn trọng khi thực hiện hành động này."
            showLink={false}
          />
        </ComponentCard>{" "}
        <ComponentCard title="Cảnh báo lỗi">
          <Alert
            variant="error"
            title="Tin nhắn lỗi"
            message="Hãy cẩn trọng khi thực hiện hành động này."
            showLink={true}
            linkHref="/"
            linkText="Tìm hiểu thêm"
          />
          <Alert
            variant="error"
            title="Tin nhắn lỗi"
            message="Hãy cẩn trọng khi thực hiện hành động này."
            showLink={false}
          />
        </ComponentCard>{" "}
        <ComponentCard title="Cảnh báo thông tin">
          <Alert
            variant="info"
            title="Tin nhắn thông tin"
            message="Hãy cẩn trọng khi thực hiện hành động này."
            showLink={true}
            linkHref="/"
            linkText="Tìm hiểu thêm"
          />
          <Alert
            variant="info"
            title="Tin nhắn thông tin"
            message="Hãy cẩn trọng khi thực hiện hành động này."
            showLink={false}
          />
        </ComponentCard>
      </div>
    </>
  );
}
