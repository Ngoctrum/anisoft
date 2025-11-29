import { ToolsListPage } from '@/components/ToolsListPage';
import { Globe } from 'lucide-react';
import { PageAccessControl } from '@/components/PageAccessControl';

export default function Website() {
  return (
    <PageAccessControl pageKey="tools_enabled" pageName="Website">
      <ToolsListPage
        title="Website Templates"
        description="Tải về các template website đẹp, responsive và dễ tùy chỉnh"
        category="website"
        icon={<Globe className="h-10 w-10" />}
      />
    </PageAccessControl>
  );
}
