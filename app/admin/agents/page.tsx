"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Search,
  MoreHorizontal,
  Eye,
  Check,
  X,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
  MapPin,
} from "lucide-react"
import { FirebaseDB, type Agent } from "@/lib/firebase-db"
import { useAuth } from "@/lib/firebase-auth"

const statusOptions = ["Tất cả", "Chờ duyệt", "Đã duyệt", "Từ chối"]
const levelOptions = ["Tất cả", "Bronze", "Silver", "Gold", "Platinum"]
const businessTypeOptions = ["Tất cả", "Bán lẻ", "Bán buôn", "Gia công", "Khác"]

export default function AgentsPage() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("Tất cả")
  const [selectedLevel, setSelectedLevel] = useState("Tất cả")
  const [selectedBusinessType, setSelectedBusinessType] = useState("Tất cả")
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAgent, setSelectedAgent] = useState<any>(null)
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false)
  const [reviewNote, setReviewNote] = useState("")

  useEffect(() => {
    const loadAgents = async () => {
      try {
        setLoading(true)
        const agentsData = await FirebaseDB.getAgents()
        setAgents(agentsData)
      } catch (error) {
        console.error("Error loading agents:", error)
      } finally {
        setLoading(false)
      }
    }

    loadAgents()

    const unsubscribe = FirebaseDB.onAgentsChange((updatedAgents) => {
      setAgents(updatedAgents)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const filteredAgents = agents.filter((agent) => {
    const matchesSearch =
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.company.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus =
      selectedStatus === "Tất cả" ||
      (selectedStatus === "Chờ duyệt" && agent.status === "pending") ||
      (selectedStatus === "Đã duyệt" && agent.status === "approved") ||
      (selectedStatus === "Từ chối" && agent.status === "rejected")

    const matchesBusinessType = selectedBusinessType === "Tất cả" || agent.businessType === selectedBusinessType

    return matchesSearch && matchesStatus && matchesBusinessType
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Chờ duyệt</Badge>
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Đã duyệt</Badge>
      case "rejected":
        return <Badge variant="destructive">Từ chối</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const handleReview = (agent: any, action: "approve" | "reject") => {
    setSelectedAgent({ ...agent, action })
    setReviewNote("")
    setIsReviewDialogOpen(true)
  }

  const handleSubmitReview = async () => {
    if (!selectedAgent || !reviewNote.trim()) return

    try {
      const newStatus = selectedAgent.action === "approve" ? "approved" : "rejected"
      const actorId = user?.uid || "admin"
      await FirebaseDB.updateAgentStatus(selectedAgent.id, newStatus, actorId)

      // Log the review action
      await FirebaseDB.logActivity(
        `agent.${selectedAgent.action}`,
        "User",
        selectedAgent.action === "approve" ? "Success" : "Warning",
        `${selectedAgent.action === "approve" ? "Duyệt" : "Từ chối"} đơn đăng ký đại lý: ${selectedAgent.email} - ${reviewNote}`,
        actorId,
      )

      setIsReviewDialogOpen(false)
      setSelectedAgent(null)
      setReviewNote("")
    } catch (error) {
      console.error("Error updating agent status:", error)
    }
  }

  const pendingCount = agents.filter((a) => a.status === "pending").length
  const approvedCount = agents.filter((a) => a.status === "approved").length
  const rejectedCount = agents.filter((a) => a.status === "rejected").length
  const totalCount = agents.length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Đang tải dữ liệu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý đăng ký đại lý</h1>
          <p className="text-gray-600 mt-1">Xét duyệt và quản lý đơn đăng ký đại lý</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tổng đơn đăng ký</p>
                <p className="text-2xl font-bold">{totalCount}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Chờ duyệt</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Đã duyệt</p>
                <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Từ chối</p>
                <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
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
                  placeholder="Tìm kiếm theo tên, email, công ty..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedBusinessType} onValueChange={setSelectedBusinessType}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Loại hình" />
              </SelectTrigger>
              <SelectContent>
                {businessTypeOptions.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Agents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách đăng ký đại lý ({filteredAgents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thông tin đại lý</TableHead>
                <TableHead>Loại hình kinh doanh</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày đăng ký</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAgents.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{agent.name}</p>
                      <p className="text-sm text-gray-500">{agent.company}</p>
                      <div className="flex items-center space-x-4 mt-1 text-xs text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Mail className="h-3 w-3" />
                          <span>{agent.email}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Phone className="h-3 w-3" />
                          <span>{agent.phone}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 mt-1 text-xs text-gray-400">
                        <MapPin className="h-3 w-3" />
                        <span className="line-clamp-1">{agent.address}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{agent.businessType}</p>
                      <p className="text-xs text-gray-500">Kinh nghiệm: {agent.experience}</p>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(agent.status)}</TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{new Date(agent.createdAt).toLocaleDateString("vi-VN")}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/agents/${agent.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            Xem chi tiết
                          </Link>
                        </DropdownMenuItem>
                        {agent.status === "pending" && (
                          <>
                            <DropdownMenuItem onClick={() => handleReview(agent, "approve")}>
                              <Check className="h-4 w-4 mr-2" />
                              Duyệt đơn
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => handleReview(agent, "reject")}>
                              <X className="h-4 w-4 mr-2" />
                              Từ chối
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedAgent?.action === "approve" ? "Duyệt đơn đăng ký đại lý" : "Từ chối đơn đăng ký"}
            </DialogTitle>
          </DialogHeader>
          {selectedAgent && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium">Thông tin đại lý:</h4>
                <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                  <div>
                    <p>
                      <strong>Tên:</strong> {selectedAgent.name}
                    </p>
                    <p>
                      <strong>Email:</strong> {selectedAgent.email}
                    </p>
                    <p>
                      <strong>Điện thoại:</strong> {selectedAgent.phone}
                    </p>
                  </div>
                  <div>
                    <p>
                      <strong>Công ty:</strong> {selectedAgent.company}
                    </p>
                    <p>
                      <strong>Loại hình:</strong> {selectedAgent.businessType}
                    </p>
                    <p>
                      <strong>Kinh nghiệm:</strong> {selectedAgent.experience}
                    </p>
                  </div>
                </div>
                <p className="text-sm mt-2">
                  <strong>Địa chỉ:</strong> {selectedAgent.address}
                </p>
              </div>

              <div>
                <Label htmlFor="reviewNote">Ghi chú {selectedAgent.action === "approve" ? "duyệt" : "từ chối"} *</Label>
                <Textarea
                  id="reviewNote"
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder={
                    selectedAgent.action === "approve"
                      ? "Nhập lý do duyệt và hướng dẫn cho đại lý..."
                      : "Nhập lý do từ chối đơn đăng ký..."
                  }
                  rows={4}
                  className="mt-1"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)}>
                  Hủy
                </Button>
                <Button
                  onClick={handleSubmitReview}
                  disabled={!reviewNote.trim()}
                  className={selectedAgent.action === "approve" ? "" : "bg-red-600 hover:bg-red-700"}
                >
                  {selectedAgent.action === "approve" ? "Duyệt đơn" : "Từ chối"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
