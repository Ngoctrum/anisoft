import { ToolsListPage } from '@/components/ToolsListPage';
import { Globe } from 'lucide-react';

export default function Website() {
  return (
    <ToolsListPage
      title="Website Templates"
      description="Tải về các template website đẹp, responsive và dễ tùy chỉnh"
      category="website"
      icon={<Globe className="h-10 w-10" />}
    />
  );
}
