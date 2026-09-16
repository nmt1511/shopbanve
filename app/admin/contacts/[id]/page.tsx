"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import { FirebaseDB, type Contact } from "@/lib/firebase-db"
import { useAuth } from "@/lib/firebase-auth"
import {
  ArrowLeft,
  Reply,
  Edit,
  Trash2,
  MessageSquare,
  Phone,
  Mail,
  Calendar,
  Building,
  User,
  Clock,
  CheckCircle,
  Loader2,
} from "lucide-react"

const statusOptions = [
  { value: "new", label: "Mới", color: "bg-blue-100 text-blue-800" },
  { value: "replied", label: "Đã phản hồi", color: "bg-green-100 text-green-800" },
  { value: "processing", label: "Đang xử lý", color: "bg-yellow-100 text-yellow-800" },
  { value: "closed", label: "Đã đóng", color: "bg-gray-100 text-gray-800" },
]

const priorityOptions = [
  { value: "high", label: "Cao", color: "bg-red-100 text-red-800" },
  { value: "medium", label: "Trung bình", color: "bg-yellow-100 text-yellow-800" },
  { value: "low", label: "Thấp", color: "bg-gray-100 text-gray-800" },
]

export default function ContactDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [contact, setContact] = useState<Contact | null>(null)
  const [loading, setLoading] = useState(true)
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false)
  const [replyMessage, setReplyMessage] = useState("")
  const [isReplying, setIsReplying] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    const id = params.id as string
    const loadContact = async () => {
      try {
        const contactData = await FirebaseDB.getContact(id)
        if (contactData) {
          setContact(contactData)
        } else {
          toast({
            title: "Lỗi",
            description: "Không tìm thấy liên hệ",
            variant: "destructive",
          })
          router.push("/admin/contacts")
        }
      } catch (error) {
        console.error("Error loading contact:", error)
        toast({
          title: "Lỗi",
          description: "Không thể tải thông tin liên hệ",
          variant: "destructive",
        })
        router.push("/admin/contacts")
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      loadContact()
    }
  }, [params.id, router])

  const handleStatusChange = async (newStatus: Contact["status"]) => {
    if (!contact) return

    setIsUpdating(true)
    try {
      await FirebaseDB.updateContactStatus(contact.id!, newStatus, user?.uid || "admin")
      setContact({ ...contact, status: newStatus })
      toast({
        title: "Thành công",
        description: "Đã cập nhật trạng thái liên hệ",
      })
    } catch (error) {
      console.error("Error updating status:", error)
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handlePriorityChange = async (newPriority: Contact["priority"]) => {
    if (!contact) return

    setIsUpdating(true)
    try {
      await FirebaseDB.updateContact(contact.id!, { priority: newPriority }, user?.uid || "admin")
      setContact({ ...contact, priority: newPriority })
      toast({
        title: "Thành công",
        description: "Đã cập nhật mức độ ưu tiên",
      })
    } catch (error) {
      console.error("Error updating priority:", error)
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật mức độ ưu tiên",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleSendReply = async () => {
    if (!contact || !replyMessage.trim()) return

    setIsReplying(true)
    try {
      await FirebaseDB.updateContactStatus(contact.id!, "replied", user?.uid || "admin")
      setContact({ ...contact, status: "replied", replied_at: new Date().toISOString() })

      toast({
        title: "Thành công",
        description: "Đã gửi phản hồi và cập nhật trạng thái",
      })

      setIsReplyDialogOpen(false)
      setReplyMessage("")
    } catch (error) {
      console.error("Error sending reply:", error)
      toast({
        title: "Lỗi",
        description: "Không thể gửi phản hồi",
        variant: "destructive",
      })
    } finally {
      setIsReplying(false)
    }
  }

  const handleDelete = async () => {
    if (!contact || !confirm("Bạn có chắc chắn muốn xóa liên hệ này?")) return

    try {
      await FirebaseDB.deleteContact(contact.id!, user?.uid || "admin")
      toast({
        title: "Thành công",
        description: "Đã xóa liên hệ",
      })
      router.push("/admin/contacts")
    } catch (error) {
      console.error("Error deleting contact:", error)
      toast({
        title: "Lỗi",
        description: "Không thể xóa liên hệ",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const statusOption = statusOptions.find((s) => s.value === status)
    return <Badge className={statusOption?.color || "bg-gray-100 text-gray-800"}>{statusOption?.label || status}</Badge>
  }

  const getPriorityBadge = (priority: string) => {
    const priorityOption = priorityOptions.find((p) => p.value === priority)
    return (
      <Badge className={priorityOption?.color || "bg-gray-100 text-gray-800"}>
        {priorityOption?.label || priority}
      </Badge>
    )
  }

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "website":
        return <MessageSquare className="h-4 w-4" />
      case "phone":
        return <Phone className="h-4 w-4" />
      case "email":
        return <Mail className="h-4 w-4" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Đang tải...</span>
      </div>
    )
  }

  if (!contact) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Không tìm thấy liên hệ</p>
        <Button asChild className="mt-4">
          <Link href="/admin/contacts">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại danh sách
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" asChild>
            <Link href="/admin/contacts">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Chi tiết liên hệ</h1>
            <p className="text-gray-600 mt-1">ID: {contact.id}</p>
            <p className="text-sm text-gray-500">Tạo lúc: {new Date(contact.created_at).toLocaleString("vi-VN")}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Reply className="h-4 w-4 mr-2" />
                Phản hồi
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Phản hồi khách hàng</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium">Tin nhắn từ khách hàng:</h4>
                  <p className="text-sm mt-2">{contact.message}</p>
                </div>
                <div>
                  <Label htmlFor="reply">Nội dung phản hồi *</Label>
                  <Textarea
                    id="reply"
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Nhập nội dung phản hồi cho khách hàng..."
                    rows={6}
                    className="mt-1"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsReplyDialogOpen(false)}>
                    Hủy
                  </Button>
                  <Button onClick={handleSendReply} disabled={!replyMessage.trim() || isReplying}>
                    {isReplying && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Gửi phản hồi
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button
            variant="outline"
            onClick={() => handleStatusChange("processing")}
            disabled={contact.status === "processing" || isUpdating}
          >
            <Clock className="h-4 w-4 mr-2" />
            Đang xử lý
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Xóa
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Thông tin khách hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Họ tên</Label>
                  <p className="text-lg font-semibold">{contact.customer_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Email</Label>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <a href={`mailto:${contact.customer_email}`} className="text-blue-600 hover:underline">
                      {contact.customer_email}
                    </a>
                  </div>
                </div>
                {contact.customer_phone && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Số điện thoại</Label>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <a href={`tel:${contact.customer_phone}`} className="text-blue-600 hover:underline">
                        {contact.customer_phone}
                      </a>
                    </div>
                  </div>
                )}
                {contact.customer_company && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Công ty</Label>
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4 text-gray-400" />
                      <p>{contact.customer_company}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Message Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                Nội dung tin nhắn
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Chủ đề</Label>
                <p className="text-lg font-semibold mt-1">{contact.subject}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Nội dung</Label>
                <div className="bg-gray-50 p-4 rounded-lg mt-2">
                  <p className="whitespace-pre-wrap">{contact.message}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Priority */}
          <Card>
            <CardHeader>
              <CardTitle>Trạng thái & Ưu tiên</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Trạng thái</Label>
                <Select value={contact.status} onValueChange={handleStatusChange} disabled={isUpdating}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Mức độ ưu tiên</Label>
                <Select value={contact.priority} onValueChange={handlePriorityChange} disabled={isUpdating}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Thời gian
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  {getSourceIcon(contact.source)}
                  <span className="text-sm capitalize">{contact.source}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Ngày tạo</p>
                    <p className="text-sm text-gray-600">{new Date(contact.created_at).toLocaleString("vi-VN")}</p>
                  </div>
                </div>
                {contact.replied_at && (
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Đã phản hồi</p>
                      <p className="text-sm text-gray-600">{new Date(contact.replied_at).toLocaleString("vi-VN")}</p>
                    </div>
                  </div>
                )}
                {contact.updated_at && contact.updated_at !== contact.created_at && (
                  <div className="flex items-start space-x-3">
                    <Edit className="h-4 w-4 text-blue-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Cập nhật cuối</p>
                      <p className="text-sm text-gray-600">{new Date(contact.updated_at).toLocaleString("vi-VN")}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Thao tác nhanh</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
                onClick={() => setIsReplyDialogOpen(true)}
              >
                <Reply className="h-4 w-4 mr-2" />
                Phản hồi khách hàng
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
                onClick={() => handleStatusChange("processing")}
                disabled={contact.status === "processing" || isUpdating}
              >
                <Clock className="h-4 w-4 mr-2" />
                Đánh dấu đang xử lý
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
                onClick={() => handleStatusChange("closed")}
                disabled={contact.status === "closed" || isUpdating}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Đóng liên hệ
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
                <a href={`mailto:${contact.customer_email}`}>
                  <Mail className="h-4 w-4 mr-2" />
                  Gửi email trực tiếp
                </a>
              </Button>
              {contact.customer_phone && (
                <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
                  <a href={`tel:${contact.customer_phone}`}>
                    <Phone className="h-4 w-4 mr-2" />
                    Gọi điện thoại
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
