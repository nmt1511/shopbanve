"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { FirebaseDB, type Contact } from "@/lib/firebase-db"
import { useAuth } from "@/lib/firebase-auth"
import {
  Search,
  Eye,
  Reply,
  Trash2,
  MessageSquare,
  Clock,
  CheckCircle,
  Phone,
  Mail,
  Calendar,
  AlertTriangle,
  Loader2,
} from "lucide-react"

const statusOptions = ["Tất cả", "Mới", "Đã phản hồi", "Đang xử lý", "Đã đóng"]
const priorityOptions = ["Tất cả", "Cao", "Trung bình", "Thấp"]
const sourceOptions = ["Tất cả", "Website", "Điện thoại", "Email"]

export default function ContactsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("Tất cả")
  const [selectedPriority, setSelectedPriority] = useState("Tất cả")
  const [selectedSource, setSelectedSource] = useState("Tất cả")
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false)
  const [replyMessage, setReplyMessage] = useState("")
  const [isReplying, setIsReplying] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    const loadContacts = async () => {
      try {
        const contactsData = await FirebaseDB.getContacts()
        setContacts(contactsData)
      } catch (error) {
        console.error("Error loading contacts:", error)
        toast({
          title: "Lỗi",
          description: "Không thể tải danh sách liên hệ",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadContacts()

    // Set up real-time listener
    const unsubscribe = FirebaseDB.onContactsChange((contactsData) => {
      setContacts(contactsData)
    })

    return unsubscribe
  }, [])

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      contact.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.subject.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus =
      selectedStatus === "Tất cả" ||
      (selectedStatus === "Mới" && contact.status === "new") ||
      (selectedStatus === "Đã phản hồi" && contact.status === "replied") ||
      (selectedStatus === "Đang xử lý" && contact.status === "processing") ||
      (selectedStatus === "Đã đóng" && contact.status === "closed")

    const matchesPriority =
      selectedPriority === "Tất cả" ||
      (selectedPriority === "Cao" && contact.priority === "high") ||
      (selectedPriority === "Trung bình" && contact.priority === "medium") ||
      (selectedPriority === "Thấp" && contact.priority === "low")

    const matchesSource =
      selectedSource === "Tất cả" ||
      (selectedSource === "Website" && contact.source === "website") ||
      (selectedSource === "Điện thoại" && contact.source === "phone") ||
      (selectedSource === "Email" && contact.source === "email")

    return matchesSearch && matchesStatus && matchesPriority && matchesSource
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return <Badge className="bg-blue-100 text-blue-800">Mới</Badge>
      case "replied":
        return <Badge className="bg-green-100 text-green-800">Đã phản hồi</Badge>
      case "processing":
        return <Badge className="bg-yellow-100 text-yellow-800">Đang xử lý</Badge>
      case "closed":
        return <Badge variant="secondary">Đã đóng</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">Cao</Badge>
      case "medium":
        return <Badge className="bg-yellow-100 text-yellow-800">Trung bình</Badge>
      case "low":
        return <Badge className="bg-gray-100 text-gray-800">Thấp</Badge>
      default:
        return <Badge variant="secondary">{priority}</Badge>
    }
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

  const handleReply = (contact: Contact) => {
    setSelectedContact(contact)
    setReplyMessage("")
    setIsReplyDialogOpen(true)
  }

  const handleSendReply = async () => {
    if (!selectedContact || !replyMessage.trim()) return

    setIsReplying(true)
    try {
      await FirebaseDB.updateContactStatus(selectedContact.id!, "replied", user?.uid || "admin")

      toast({
        title: "Thành công",
        description: "Đã gửi phản hồi và cập nhật trạng thái",
      })

      setIsReplyDialogOpen(false)
      setSelectedContact(null)
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

  const handleDelete = async (contactId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa liên hệ này?")) return

    try {
      await FirebaseDB.deleteContact(contactId, user?.uid || "admin")
      toast({
        title: "Thành công",
        description: "Đã xóa liên hệ",
      })
    } catch (error) {
      console.error("Error deleting contact:", error)
      toast({
        title: "Lỗi",
        description: "Không thể xóa liên hệ",
        variant: "destructive",
      })
    }
  }

  const handleStatusUpdate = async (contactId: string, newStatus: Contact["status"]) => {
    try {
      await FirebaseDB.updateContactStatus(contactId, newStatus, user?.uid || "admin")
      toast({
        title: "Thành công",
        description: `Đã cập nhật trạng thái thành ${newStatus === "processing" ? "đang xử lý" : "đã đóng"}`,
      })
    } catch (error) {
      console.error("Error updating contact status:", error)
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái",
        variant: "destructive",
      })
    }
  }

  const newCount = contacts.filter((c) => c.status === "new").length
  const repliedCount = contacts.filter((c) => c.status === "replied").length
  const processingCount = contacts.filter((c) => c.status === "processing").length
  const highPriorityCount = contacts.filter((c) => c.priority === "high").length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Đang tải...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý liên hệ & tin nhắn</h1>
          <p className="text-gray-600 mt-1">Xử lý yêu cầu và tin nhắn từ khách hàng</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tin nhắn mới</p>
                <p className="text-2xl font-bold text-blue-600">{newCount}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Đã phản hồi</p>
                <p className="text-2xl font-bold text-green-600">{repliedCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Đang xử lý</p>
                <p className="text-2xl font-bold text-yellow-600">{processingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ưu tiên cao</p>
                <p className="text-2xl font-bold text-red-600">{highPriorityCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Tìm kiếm theo tên, email, chủ đề..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelectedStatus("Tất cả")} className="h-8 px-2">
              Tất cả
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedStatus("Mới")} className="h-8 px-2">
              Mới
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedStatus("Đã phản hồi")} className="h-8 px-2">
              Đã phản hồi
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedStatus("Đang xử lý")} className="h-8 px-2">
              Đang xử lý
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedStatus("Đã đóng")} className="h-8 px-2">
              Đã đóng
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedPriority("Tất cả")} className="h-8 px-2">
              Tất cả
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedPriority("Cao")} className="h-8 px-2">
              Cao
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedPriority("Trung bình")} className="h-8 px-2">
              Trung bình
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedPriority("Thấp")} className="h-8 px-2">
              Thấp
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedSource("Tất cả")} className="h-8 px-2">
              Tất cả
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedSource("Website")} className="h-8 px-2">
              Website
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedSource("Điện thoại")} className="h-8 px-2">
              Điện thoại
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedSource("Email")} className="h-8 px-2">
              Email
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contacts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách liên hệ ({filteredContacts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Chủ đề</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ưu tiên</TableHead>
                <TableHead>Nguồn</TableHead>
                <TableHead>Thời gian</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{contact.customer_name}</p>
                      <p className="text-sm text-gray-500">{contact.customer_email}</p>
                      {contact.customer_phone && <p className="text-sm text-gray-500">{contact.customer_phone}</p>}
                      {contact.customer_company && <p className="text-xs text-gray-400">{contact.customer_company}</p>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium line-clamp-2">{contact.subject}</p>
                      <p className="text-sm text-gray-500 line-clamp-2 mt-1">{contact.message}</p>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(contact.status)}</TableCell>
                  <TableCell>{getPriorityBadge(contact.priority)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      {getSourceIcon(contact.source)}
                      <span className="text-sm capitalize">{contact.source}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="flex items-center space-x-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(contact.created_at).toLocaleString("vi-VN")}</span>
                      </div>
                      {contact.replied_at && (
                        <p className="text-xs text-green-600 mt-1">
                          Phản hồi: {new Date(contact.replied_at).toLocaleString("vi-VN")}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <Button variant="ghost" size="sm" asChild className="h-8 px-2">
                        <Link href={`/admin/contacts/${contact.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleReply(contact)} className="h-8 px-2">
                        <Reply className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStatusUpdate(contact.id!, "processing")}
                        className="h-8 px-2 text-yellow-600 hover:text-yellow-700"
                      >
                        <Clock className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStatusUpdate(contact.id!, "closed")}
                        className="h-8 px-2 text-green-600 hover:text-green-700"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(contact.id!)}
                        className="h-8 px-2 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Reply Dialog */}
      <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Phản hồi khách hàng</DialogTitle>
          </DialogHeader>
          {selectedContact && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium">Thông tin khách hàng:</h4>
                <p className="text-sm mt-1">
                  <strong>Tên:</strong> {selectedContact.customer_name}
                </p>
                <p className="text-sm">
                  <strong>Email:</strong> {selectedContact.customer_email}
                </p>
                {selectedContact.customer_phone && (
                  <p className="text-sm">
                    <strong>Điện thoại:</strong> {selectedContact.customer_phone}
                  </p>
                )}
                {selectedContact.customer_company && (
                  <p className="text-sm">
                    <strong>Công ty:</strong> {selectedContact.customer_company}
                  </p>
                )}
                <p className="text-sm">
                  <strong>Chủ đề:</strong> {selectedContact.subject}
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium">Tin nhắn từ khách hàng:</h4>
                <p className="text-sm mt-2">{selectedContact.message}</p>
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
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
