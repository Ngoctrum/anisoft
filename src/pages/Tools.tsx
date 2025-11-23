import { ToolsListPage } from '@/components/ToolsListPage';
import { Download } from 'lucide-react';

export default function Tools() {
  return (
    <ToolsListPage
      title="Khám Phá Tools"
      description="Tìm kiếm và tải xuống các công cụ từ cộng đồng Ani Studio"
      category="all"
      icon={<Download className="h-10 w-10" />}
    />
  );
}
