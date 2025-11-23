import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Eye, ExternalLink } from 'lucide-react';

export default function AdminReports() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    
    const { data } = await supabase
      .from('error_reports')
      .select(`
        *,
        tools(id, title, slug),
        profiles(username, display_name)
      `)
      .order('created_at', { ascending: false });

    setReports(data || []);
    setLoading(false);
  };

  const handleOpenDialog = (report: any) => {
    setSelectedReport(report);
    setAdminNote(report.admin_note || '');
    setStatus(report.status);
    setDialogOpen(true);
  };

  const handleUpdateReport = async () => {
    const { error } = await supabase
      .from('error_reports')
      .update({
        status,
        admin_note: adminNote,
      })
      .eq('id', selectedReport.id);

    if (error) {
      toast.error('Cập nhật thất bại');
    } else {
      toast.success('Đã cập nhật báo cáo');
      setDialogOpen(false);
      loadReports();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Chờ xử lý</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-500">Đang xử lý</Badge>;
      case 'resolved':
        return <Badge className="bg-green-500">Đã giải quyết</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getSupportTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      tool_error: '🔧 Tools lỗi',
      website_error: '🌐 Website lỗi',
      website_report: '📝 Báo cáo website',
      general: '💬 Khách',
      support_request: '🤝 Yêu cầu hỗ trợ',
    };
    return labels[type] || type;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Quản lý Báo lỗi & Hỗ trợ</h1>
          <p className="text-muted-foreground">
            Xem và xử lý các báo cáo lỗi và yêu cầu hỗ trợ từ người dùng
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {reports.map((report) => (
              <Card key={report.id} className="bg-gradient-card border-border">
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{report.title}</h3>
                        <div className="flex gap-2 items-center text-sm text-muted-foreground mt-1">
                          <Badge variant="outline" className="text-xs">
                            {getSupportTypeLabel(report.support_type || 'tool_error')}
                          </Badge>
                          {report.tools?.title && (
                            <span>
                              • Tool: <span className="text-foreground">{report.tools.title}</span>
                            </span>
                          )}
                        </div>
                      </div>
                      {getStatusBadge(report.status)}
                    </div>

                    <p className="text-sm">{report.message}</p>

                    {report.screenshot_url && (
                      <a
                        href={report.screenshot_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                      >
                        Xem ảnh lỗi
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t text-sm text-muted-foreground">
                      <span>
                        Báo cáo bởi: {report.profiles?.display_name || report.profiles?.username || 'Ẩn danh'}
                      </span>
                      <span>{new Date(report.created_at).toLocaleString('vi-VN')}</span>
                    </div>

                    {report.admin_note && (
                      <div className="bg-muted/50 p-3 rounded-lg text-sm">
                        <p className="font-semibold mb-1">Ghi chú admin:</p>
                        <p>{report.admin_note}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDialog(report)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Xử lý
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Xử lý báo cáo</DialogTitle>
              <DialogDescription>
                Cập nhật trạng thái và ghi chú
              </DialogDescription>
            </DialogHeader>

            {selectedReport && (
              <div className="space-y-4">
                <div>
                  <Badge variant="outline" className="mb-2">
                    {getSupportTypeLabel(selectedReport.support_type || 'tool_error')}
                  </Badge>
                  <h4 className="font-semibold mb-2">{selectedReport.title}</h4>
                  <p className="text-sm text-muted-foreground">{selectedReport.message}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Trạng thái</label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Chờ xử lý</SelectItem>
                      <SelectItem value="in_progress">Đang xử lý</SelectItem>
                      <SelectItem value="resolved">Đã giải quyết</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Ghi chú admin</label>
                  <Textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    rows={4}
                    placeholder="Thêm ghi chú nội bộ..."
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button onClick={handleUpdateReport} className="bg-gradient-primary">
                Lưu thay đổi
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
