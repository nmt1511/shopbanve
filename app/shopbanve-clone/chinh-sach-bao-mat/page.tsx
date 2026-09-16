import { PageIntro } from "../components/site-page"
import ShopShell from "../components/shop-shell"

export default function PrivacyPolicyPage() {
  return (
    <ShopShell>
      <PageIntro
        eyebrow="Pháp lý"
        title="Chính sách bảo mật"
        description="Chúng tôi tôn trọng thông tin bạn cung cấp và chỉ sử dụng dữ liệu cần thiết để vận hành Shop Bản Vẽ."
      />
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="prose prose-slate max-w-none text-base leading-8">
          <h2>Thông tin chúng tôi thu thập</h2>
          <p>
            Khi tạo tài khoản, liên hệ hoặc đăng ký nhận thông tin, bạn có thể cung cấp họ tên, email và thông tin
            liên quan đến nhu cầu sử dụng tài liệu. Chúng tôi không yêu cầu thông tin không cần thiết cho dịch vụ.
          </p>
          <h2>Cách chúng tôi sử dụng dữ liệu</h2>
          <p>
            Dữ liệu được dùng để xác thực tài khoản, lưu lịch sử tài liệu, hỗ trợ yêu cầu và cải thiện trải nghiệm tìm
            kiếm. Chúng tôi không bán thông tin cá nhân cho bên thứ ba.
          </p>
          <h2>Lưu trữ và bảo vệ</h2>
          <p>
            Dữ liệu được lưu trên các dịch vụ hạ tầng có kiểm soát quyền truy cập. Các thông tin nhạy cảm không được
            đưa vào mã nguồn phía trình duyệt hoặc log công khai.
          </p>
          <h2>Quyền của bạn</h2>
          <p>
            Bạn có thể yêu cầu cập nhật hoặc xóa thông tin tài khoản bằng cách liên hệ với chúng tôi. Chính sách này
            sẽ được cập nhật khi các tính năng tài khoản và thanh toán được tích hợp đầy đủ.
          </p>
        </div>
      </article>
    </ShopShell>
  )
}
