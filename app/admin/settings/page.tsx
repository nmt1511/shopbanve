"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Settings, Building, Mail, Globe, Bell, Upload, Save, Loader2, Home } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/firebase-auth"
import {
  FirebaseSettings,
  type CompanySettings,
  type SeoSettings,
  type EmailSettings,
  type NotificationSettings,
  type SystemSettings,
} from "@/lib/firebase-settings"
import { storage } from "@/lib/firebase"
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage"

interface HomepageSettings {
  aboutTitle: string
  aboutDescription: string
  aboutImage: string
  servicesTitle: string
  servicesDescription: string
  showTestimonials: boolean
  testimonialsTitle: string
  showStats: boolean
  statsTitle: string
  contactTitle: string
  contactDescription: string
  showNewsletter: boolean
  newsletterTitle: string
  newsletterDescription: string
  footerDescription: string
  socialLinks: {
    facebook: string
    zalo: string
    youtube: string
    linkedin: string
  }
}

export default function SettingsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    name: "",
    description: "",
    address: "",
    phone: "",
    hotline: "",
    email: "",
    website: "",
    taxCode: "",
    businessLicense: "",
    logo: "",
    favicon: "",
  })

  const [seoSettings, setSeoSettings] = useState<SeoSettings>({
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
    googleAnalytics: "",
    facebookPixel: "",
    googleTagManager: "",
  })

  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    smtpHost: "",
    smtpPort: "",
    smtpUser: "",
    smtpPassword: "",
    fromName: "",
    fromEmail: "",
    enableSSL: true,
  })

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    newOrder: true,
    newContact: true,
    newAgent: true,
    lowStock: true,
    systemUpdate: false,
    emailNotifications: true,
    smsNotifications: false,
  })

  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    siteName: "",
    timezone: "Asia/Ho_Chi_Minh",
    language: "vi",
    currency: "VND",
    dateFormat: "dd/mm/yyyy",
    maintenanceMode: false,
    allowRegistration: false,
    requireEmailVerification: true,
  })

  const [homepageSettings, setHomepageSettings] = useState<HomepageSettings>({
    aboutTitle: "",
    aboutDescription: "",
    aboutImage: "",
    servicesTitle: "",
    servicesDescription: "",
    showTestimonials: true,
    testimonialsTitle: "",
    showStats: true,
    statsTitle: "",
    contactTitle: "",
    contactDescription: "",
    showNewsletter: true,
    newsletterTitle: "",
    newsletterDescription: "",
    footerDescription: "",
    socialLinks: {
      facebook: "",
      zalo: "",
      youtube: "",
      linkedin: "",
    },
  })

  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Initialize default settings if they don't exist
        await FirebaseSettings.initializeDefaultSettings()

        // Load all settings
        const [company, seo, email, notifications, system, homepage] = await Promise.all([
          FirebaseSettings.getSettings("company"),
          FirebaseSettings.getSettings("seo"),
          FirebaseSettings.getSettings("email"),
          FirebaseSettings.getSettings("notifications"),
          FirebaseSettings.getSettings("system"),
          FirebaseSettings.getSettings("homepage" as never) as Promise<HomepageSettings | null>,
        ])

        if (company) setCompanySettings(company)
        if (seo) setSeoSettings(seo)
        if (email) setEmailSettings(email)
        if (notifications) setNotificationSettings(notifications)
        if (system) setSystemSettings(system)
        if (homepage) setHomepageSettings(homepage)
      } catch (error) {
        console.error("Error loading settings:", error)
        toast({
          title: "Lỗi",
          description: "Không thể tải cài đặt. Vui lòng thử lại.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [toast])

  const handleCompanyChange = (field: keyof CompanySettings, value: string) => {
    setCompanySettings((prev) => ({ ...prev, [field]: value }))
  }

  const handleSeoChange = (field: keyof SeoSettings, value: string) => {
    setSeoSettings((prev) => ({ ...prev, [field]: value }))
  }

  const handleEmailChange = (field: keyof EmailSettings, value: string | boolean) => {
    setEmailSettings((prev) => ({ ...prev, [field]: value }))
  }

  const handleNotificationChange = (field: keyof NotificationSettings, value: boolean) => {
    setNotificationSettings((prev) => ({ ...prev, [field]: value }))
  }

  const handleSystemChange = (field: keyof SystemSettings, value: string | boolean) => {
    setSystemSettings((prev) => ({ ...prev, [field]: value }))
  }

  const handleHomepageChange = (field: keyof HomepageSettings, value: string | boolean | object) => {
    setHomepageSettings((prev) => ({ ...prev, [field]: value }))
  }

  const handleSocialLinkChange = (platform: keyof HomepageSettings["socialLinks"], value: string) => {
    setHomepageSettings((prev) => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [platform]: value },
    }))
  }

  const handleSave = async (section: string) => {
    if (!user) {
      toast({
        title: "Lỗi",
        description: "Bạn cần đăng nhập để lưu cài đặt.",
        variant: "destructive",
      })
      return
    }

    setSaving(section)
    try {
      switch (section) {
        case "company":
          await FirebaseSettings.saveSettings("company", companySettings, user.uid)
          break
        case "seo":
          await FirebaseSettings.saveSettings("seo", seoSettings, user.uid)
          break
        case "email":
          await FirebaseSettings.saveSettings("email", emailSettings, user.uid)
          break
        case "notifications":
          await FirebaseSettings.saveSettings("notifications", notificationSettings, user.uid)
          break
        case "system":
          await FirebaseSettings.saveSettings("system", systemSettings, user.uid)
          break
        case "homepage":
          await FirebaseSettings.saveSettings("homepage" as never, homepageSettings as never, user.uid)
          break
      }

      toast({
        title: "Thành công",
        description: "Cài đặt đã được lưu thành công.",
      })
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Lỗi",
        description: "Không thể lưu cài đặt. Vui lòng thử lại.",
        variant: "destructive",
      })
    } finally {
      setSaving(null)
    }
  }

  const handleImageUpload = async (
    field: "logo" | "favicon" | "aboutImage", // Removed heroBackgroundImage from upload fields
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setSaving(`${field}-upload`)

      // Create a reference to the file in Firebase Storage
      const imageRef = storageRef(storage, `company/${field}-${Date.now()}-${file.name}`)

      // Upload the file
      const snapshot = await uploadBytes(imageRef, file)

      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref)

      // Update the settings
      if (field === "logo" || field === "favicon") {
        handleCompanyChange(field, downloadURL)
      } else {
        handleHomepageChange(field, downloadURL)
      }

      toast({
        title: "Thành công",
        description: `Hình ảnh đã được tải lên thành công.`,
      })
    } catch (error) {
      console.error("Error uploading image:", error)
      toast({
        title: "Lỗi",
        description: "Không thể tải lên hình ảnh. Vui lòng thử lại.",
        variant: "destructive",
      })
    } finally {
      setSaving(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Đang tải cài đặt...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cài đặt hệ thống</h1>
          <p className="text-gray-600 mt-1">Quản lý cấu hình và thiết lập website</p>
        </div>
      </div>

      <Tabs defaultValue="homepage" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="homepage">Trang chủ</TabsTrigger>
          <TabsTrigger value="company">Công ty</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="notifications">Thông báo</TabsTrigger>
          <TabsTrigger value="system">Hệ thống</TabsTrigger>
        </TabsList>

        <TabsContent value="homepage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Home className="h-5 w-5 mr-2" />
                Cài đặt trang chủ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* About Section */}
              <div className="space-y-4">
                <h4 className="font-medium">Phần Giới thiệu</h4>
                <div>
                  <Label htmlFor="aboutTitle">Tiêu đề giới thiệu</Label>
                  <Input
                    id="aboutTitle"
                    value={homepageSettings.aboutTitle}
                    onChange={(e) => handleHomepageChange("aboutTitle", e.target.value)}
                    placeholder="Về chúng tôi"
                  />
                </div>
                <div>
                  <Label htmlFor="aboutDescription">Mô tả giới thiệu</Label>
                  <Textarea
                    id="aboutDescription"
                    value={homepageSettings.aboutDescription}
                    onChange={(e) => handleHomepageChange("aboutDescription", e.target.value)}
                    placeholder="Mô tả về công ty..."
                    rows={4}
                  />
                </div>
                <div>
                  <Label>Hình ảnh giới thiệu</Label>
                  {homepageSettings.aboutImage ? (
                    <div className="mt-2">
                      <img
                        src={homepageSettings.aboutImage || "/placeholder.svg"}
                        alt="About"
                        className="h-32 w-full object-cover rounded border"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 bg-transparent"
                        onClick={() => handleHomepageChange("aboutImage", "")}
                      >
                        Xóa hình ảnh
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload("aboutImage", e)}
                        className="hidden"
                        id="about-image-upload"
                      />
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById("about-image-upload")?.click()}
                        className="w-full"
                        disabled={saving === "aboutImage-upload"}
                      >
                        {saving === "aboutImage-upload" ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4 mr-2" />
                        )}
                        Tải hình ảnh giới thiệu
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Services Section */}
              <div className="space-y-4">
                <h4 className="font-medium">Phần Dịch vụ</h4>
                <div>
                  <Label htmlFor="servicesTitle">Tiêu đề dịch vụ</Label>
                  <Input
                    id="servicesTitle"
                    value={homepageSettings.servicesTitle}
                    onChange={(e) => handleHomepageChange("servicesTitle", e.target.value)}
                    placeholder="Dịch vụ của chúng tôi"
                  />
                </div>
                <div>
                  <Label htmlFor="servicesDescription">Mô tả dịch vụ</Label>
                  <Textarea
                    id="servicesDescription"
                    value={homepageSettings.servicesDescription}
                    onChange={(e) => handleHomepageChange("servicesDescription", e.target.value)}
                    placeholder="Mô tả về các dịch vụ..."
                    rows={3}
                  />
                </div>
              </div>

              <Separator />

              {/* Other Sections */}
              <div className="space-y-4">
                <h4 className="font-medium">Các phần khác</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="showTestimonials">Hiển thị phần đánh giá</Label>
                      <p className="text-sm text-gray-500">Hiển thị testimonials từ khách hàng</p>
                    </div>
                    <Switch
                      id="showTestimonials"
                      checked={homepageSettings.showTestimonials}
                      onCheckedChange={(checked) => handleHomepageChange("showTestimonials", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="showStats">Hiển thị thống kê</Label>
                      <p className="text-sm text-gray-500">Hiển thị số liệu thống kê</p>
                    </div>
                    <Switch
                      id="showStats"
                      checked={homepageSettings.showStats}
                      onCheckedChange={(checked) => handleHomepageChange("showStats", checked)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="testimonialsTitle">Tiêu đề phần đánh giá</Label>
                    <Input
                      id="testimonialsTitle"
                      value={homepageSettings.testimonialsTitle}
                      onChange={(e) => handleHomepageChange("testimonialsTitle", e.target.value)}
                      placeholder="Khách hàng nói gì về chúng tôi"
                    />
                  </div>
                  <div>
                    <Label htmlFor="statsTitle">Tiêu đề phần thống kê</Label>
                    <Input
                      id="statsTitle"
                      value={homepageSettings.statsTitle}
                      onChange={(e) => handleHomepageChange("statsTitle", e.target.value)}
                      placeholder="Thành tựu của chúng tôi"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Contact & Newsletter */}
              <div className="space-y-4">
                <h4 className="font-medium">Liên hệ & Newsletter</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contactTitle">Tiêu đề phần liên hệ</Label>
                    <Input
                      id="contactTitle"
                      value={homepageSettings.contactTitle}
                      onChange={(e) => handleHomepageChange("contactTitle", e.target.value)}
                      placeholder="Liên hệ với chúng tôi"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newsletterTitle">Tiêu đề Newsletter</Label>
                    <Input
                      id="newsletterTitle"
                      value={homepageSettings.newsletterTitle}
                      onChange={(e) => handleHomepageChange("newsletterTitle", e.target.value)}
                      placeholder="Đăng ký nhận tin"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contactDescription">Mô tả liên hệ</Label>
                    <Textarea
                      id="contactDescription"
                      value={homepageSettings.contactDescription}
                      onChange={(e) => handleHomepageChange("contactDescription", e.target.value)}
                      placeholder="Mô tả về cách liên hệ..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="newsletterDescription">Mô tả Newsletter</Label>
                    <Textarea
                      id="newsletterDescription"
                      value={homepageSettings.newsletterDescription}
                      onChange={(e) => handleHomepageChange("newsletterDescription", e.target.value)}
                      placeholder="Mô tả về newsletter..."
                      rows={3}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="showNewsletter">Hiển thị Newsletter</Label>
                    <p className="text-sm text-gray-500">Hiển thị form đăng ký newsletter</p>
                  </div>
                  <Switch
                    id="showNewsletter"
                    checked={homepageSettings.showNewsletter}
                    onCheckedChange={(checked) => handleHomepageChange("showNewsletter", checked)}
                  />
                </div>
              </div>

              <Separator />

              {/* Social Links */}
              <div className="space-y-4">
                <h4 className="font-medium">Liên kết mạng xã hội</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="facebook">Facebook</Label>
                    <Input
                      id="facebook"
                      value={homepageSettings.socialLinks.facebook}
                      onChange={(e) => handleSocialLinkChange("facebook", e.target.value)}
                      placeholder="https://facebook.com/yourpage"
                    />
                  </div>
                  <div>
                    <Label htmlFor="zalo">Zalo</Label>
                    <Input
                      id="zalo"
                      value={homepageSettings.socialLinks.zalo}
                      onChange={(e) => handleSocialLinkChange("zalo", e.target.value)}
                      placeholder="https://zalo.me/yourpage"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="youtube">YouTube</Label>
                    <Input
                      id="youtube"
                      value={homepageSettings.socialLinks.youtube}
                      onChange={(e) => handleSocialLinkChange("youtube", e.target.value)}
                      placeholder="https://youtube.com/yourchannel"
                    />
                  </div>
                  <div>
                    <Label htmlFor="linkedin">LinkedIn</Label>
                    <Input
                      id="linkedin"
                      value={homepageSettings.socialLinks.linkedin}
                      onChange={(e) => handleSocialLinkChange("linkedin", e.target.value)}
                      placeholder="https://linkedin.com/company/yourcompany"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Footer */}
              <div className="space-y-4">
                <h4 className="font-medium">Footer</h4>
                <div>
                  <Label htmlFor="footerDescription">Mô tả footer</Label>
                  <Textarea
                    id="footerDescription"
                    value={homepageSettings.footerDescription}
                    onChange={(e) => handleHomepageChange("footerDescription", e.target.value)}
                    placeholder="Mô tả ngắn gọn về công ty trong footer..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSave("homepage")} disabled={saving === "homepage"}>
                  {saving === "homepage" ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Lưu cài đặt trang chủ
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Company Settings */}
        <TabsContent value="company" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="h-5 w-5 mr-2" />
                Thông tin công ty
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyName">Tên công ty *</Label>
                  <Input
                    id="companyName"
                    value={companySettings.name}
                    onChange={(e) => handleCompanyChange("name", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="taxCode">Mã số thuế</Label>
                  <Input
                    id="taxCode"
                    value={companySettings.taxCode}
                    onChange={(e) => handleCompanyChange("taxCode", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Mô tả công ty</Label>
                <Textarea
                  id="description"
                  value={companySettings.description}
                  onChange={(e) => handleCompanyChange("description", e.target.value)}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="address">Địa chỉ</Label>
                <Textarea
                  id="address"
                  value={companySettings.address}
                  onChange={(e) => handleCompanyChange("address", e.target.value)}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="phone">Điện thoại</Label>
                  <Input
                    id="phone"
                    value={companySettings.phone}
                    onChange={(e) => handleCompanyChange("phone", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="hotline">Hotline</Label>
                  <Input
                    id="hotline"
                    value={companySettings.hotline}
                    onChange={(e) => handleCompanyChange("hotline", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={companySettings.email}
                    onChange={(e) => handleCompanyChange("email", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={companySettings.website}
                    onChange={(e) => handleCompanyChange("website", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="businessLicense">Giấy phép kinh doanh</Label>
                  <Input
                    id="businessLicense"
                    value={companySettings.businessLicense}
                    onChange={(e) => handleCompanyChange("businessLicense", e.target.value)}
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Logo công ty</Label>
                  {companySettings.logo ? (
                    <div className="mt-2">
                      <img
                        src={companySettings.logo || "/placeholder.svg"}
                        alt="Logo"
                        className="h-20 w-auto object-contain border rounded"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 bg-transparent"
                        onClick={() => handleCompanyChange("logo", "")}
                      >
                        Xóa logo
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload("logo", e)}
                        className="hidden"
                        id="logo-upload"
                      />
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById("logo-upload")?.click()}
                        className="w-full"
                        disabled={saving === "logo-upload"}
                      >
                        {saving === "logo-upload" ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4 mr-2" />
                        )}
                        Tải logo
                      </Button>
                    </div>
                  )}
                </div>

                <div>
                  <Label>Favicon</Label>
                  {companySettings.favicon ? (
                    <div className="mt-2">
                      <img
                        src={companySettings.favicon || "/placeholder.svg"}
                        alt="Favicon"
                        className="h-8 w-8 object-contain border rounded"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 bg-transparent"
                        onClick={() => handleCompanyChange("favicon", "")}
                      >
                        Xóa favicon
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload("favicon", e)}
                        className="hidden"
                        id="favicon-upload"
                      />
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById("favicon-upload")?.click()}
                        className="w-full"
                        disabled={saving === "favicon-upload"}
                      >
                        {saving === "favicon-upload" ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4 mr-2" />
                        )}
                        Tải favicon
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSave("company")} disabled={saving === "company"}>
                  {saving === "company" ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Lưu thông tin công ty
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO Settings */}
        <TabsContent value="seo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="h-5 w-5 mr-2" />
                Cài đặt SEO
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="metaTitle">Tiêu đề SEO</Label>
                <Input
                  id="metaTitle"
                  value={seoSettings.metaTitle}
                  onChange={(e) => handleSeoChange("metaTitle", e.target.value)}
                  placeholder="Tiêu đề trang web cho SEO"
                />
              </div>

              <div>
                <Label htmlFor="metaDescription">Mô tả SEO</Label>
                <Textarea
                  id="metaDescription"
                  value={seoSettings.metaDescription}
                  onChange={(e) => handleSeoChange("metaDescription", e.target.value)}
                  placeholder="Mô tả trang web cho SEO"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="metaKeywords">Từ khóa SEO</Label>
                <Input
                  id="metaKeywords"
                  value={seoSettings.metaKeywords}
                  onChange={(e) => handleSeoChange("metaKeywords", e.target.value)}
                  placeholder="Từ khóa phân cách bằng dấu phẩy"
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Mã theo dõi</h4>
                <div>
                  <Label htmlFor="googleAnalytics">Google Analytics ID</Label>
                  <Input
                    id="googleAnalytics"
                    value={seoSettings.googleAnalytics}
                    onChange={(e) => handleSeoChange("googleAnalytics", e.target.value)}
                    placeholder="G-XXXXXXXXXX"
                  />
                </div>

                <div>
                  <Label htmlFor="facebookPixel">Facebook Pixel ID</Label>
                  <Input
                    id="facebookPixel"
                    value={seoSettings.facebookPixel}
                    onChange={(e) => handleSeoChange("facebookPixel", e.target.value)}
                    placeholder="123456789012345"
                  />
                </div>

                <div>
                  <Label htmlFor="googleTagManager">Google Tag Manager ID</Label>
                  <Input
                    id="googleTagManager"
                    value={seoSettings.googleTagManager}
                    onChange={(e) => handleSeoChange("googleTagManager", e.target.value)}
                    placeholder="GTM-XXXXXXX"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSave("seo")} disabled={saving === "seo"}>
                  {saving === "seo" ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Lưu cài đặt SEO
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="h-5 w-5 mr-2" />
                Cài đặt Email
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="smtpHost">SMTP Host</Label>
                  <Input
                    id="smtpHost"
                    value={emailSettings.smtpHost}
                    onChange={(e) => handleEmailChange("smtpHost", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="smtpPort">SMTP Port</Label>
                  <Input
                    id="smtpPort"
                    value={emailSettings.smtpPort}
                    onChange={(e) => handleEmailChange("smtpPort", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="smtpUser">SMTP Username</Label>
                  <Input
                    id="smtpUser"
                    value={emailSettings.smtpUser}
                    onChange={(e) => handleEmailChange("smtpUser", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="smtpPassword">SMTP Password</Label>
                  <Input
                    id="smtpPassword"
                    type="password"
                    value={emailSettings.smtpPassword}
                    onChange={(e) => handleEmailChange("smtpPassword", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fromName">Tên người gửi</Label>
                  <Input
                    id="fromName"
                    value={emailSettings.fromName}
                    onChange={(e) => handleEmailChange("fromName", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="fromEmail">Email người gửi</Label>
                  <Input
                    id="fromEmail"
                    type="email"
                    value={emailSettings.fromEmail}
                    onChange={(e) => handleEmailChange("fromEmail", e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="enableSSL">Kích hoạt SSL</Label>
                <Switch
                  id="enableSSL"
                  checked={emailSettings.enableSSL}
                  onCheckedChange={(checked) => handleEmailChange("enableSSL", checked)}
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSave("email")} disabled={saving === "email"}>
                  {saving === "email" ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Lưu cài đặt Email
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Cài đặt thông báo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <h4 className="font-medium">Thông báo sự kiện</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="newOrder">Đơn hàng mới</Label>
                    <Switch
                      id="newOrder"
                      checked={notificationSettings.newOrder}
                      onCheckedChange={(checked) => handleNotificationChange("newOrder", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="newContact">Liên hệ mới</Label>
                    <Switch
                      id="newContact"
                      checked={notificationSettings.newContact}
                      onCheckedChange={(checked) => handleNotificationChange("newContact", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="newAgent">Đăng ký đại lý mới</Label>
                    <Switch
                      id="newAgent"
                      checked={notificationSettings.newAgent}
                      onCheckedChange={(checked) => handleNotificationChange("newAgent", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="lowStock">Sản phẩm sắp hết hàng</Label>
                    <Switch
                      id="lowStock"
                      checked={notificationSettings.lowStock}
                      onCheckedChange={(checked) => handleNotificationChange("lowStock", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="systemUpdate">Cập nhật hệ thống</Label>
                    <Switch
                      id="systemUpdate"
                      checked={notificationSettings.systemUpdate}
                      onCheckedChange={(checked) => handleNotificationChange("systemUpdate", checked)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Phương thức thông báo</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="emailNotifications">Thông báo qua Email</Label>
                    <Switch
                      id="emailNotifications"
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={(checked) => handleNotificationChange("emailNotifications", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="smsNotifications">Thông báo qua SMS</Label>
                    <Switch
                      id="smsNotifications"
                      checked={notificationSettings.smsNotifications}
                      onCheckedChange={(checked) => handleNotificationChange("smsNotifications", checked)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSave("notifications")} disabled={saving === "notifications"}>
                  {saving === "notifications" ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Lưu cài đặt thông báo
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Cài đặt hệ thống
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="siteName">Tên trang quản trị</Label>
                  <Input
                    id="siteName"
                    value={systemSettings.siteName}
                    onChange={(e) => handleSystemChange("siteName", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="timezone">Múi giờ</Label>
                  <Select
                    value={systemSettings.timezone}
                    onValueChange={(value) => handleSystemChange("timezone", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Ho_Chi_Minh">Việt Nam (UTC+7)</SelectItem>
                      <SelectItem value="Asia/Bangkok">Bangkok (UTC+7)</SelectItem>
                      <SelectItem value="Asia/Singapore">Singapore (UTC+8)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="language">Ngôn ngữ</Label>
                  <Select
                    value={systemSettings.language}
                    onValueChange={(value) => handleSystemChange("language", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vi">Tiếng Việt</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="currency">Đơn vị tiền tệ</Label>
                  <Select
                    value={systemSettings.currency}
                    onValueChange={(value) => handleSystemChange("currency", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VND">VND (₫)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dateFormat">Định dạng ngày</Label>
                  <Select
                    value={systemSettings.dateFormat}
                    onValueChange={(value) => handleSystemChange("dateFormat", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dd/mm/yyyy">dd/mm/yyyy</SelectItem>
                      <SelectItem value="mm/dd/yyyy">mm/dd/yyyy</SelectItem>
                      <SelectItem value="yyyy-mm-dd">yyyy-mm-dd</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Cài đặt bảo mật</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="maintenanceMode">Chế độ bảo trì</Label>
                      <p className="text-sm text-gray-500">Tạm dừng truy cập website</p>
                    </div>
                    <Switch
                      id="maintenanceMode"
                      checked={systemSettings.maintenanceMode}
                      onCheckedChange={(checked) => handleSystemChange("maintenanceMode", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="allowRegistration">Cho phép đăng ký</Label>
                      <p className="text-sm text-gray-500">Người dùng có thể tự đăng ký tài khoản</p>
                    </div>
                    <Switch
                      id="allowRegistration"
                      checked={systemSettings.allowRegistration}
                      onCheckedChange={(checked) => handleSystemChange("allowRegistration", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="requireEmailVerification">Xác thực email</Label>
                      <p className="text-sm text-gray-500">Yêu cầu xác thực email khi đăng ký</p>
                    </div>
                    <Switch
                      id="requireEmailVerification"
                      checked={systemSettings.requireEmailVerification}
                      onCheckedChange={(checked) => handleSystemChange("requireEmailVerification", checked)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSave("system")} disabled={saving === "system"}>
                  {saving === "system" ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Lưu cài đặt hệ thống
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
