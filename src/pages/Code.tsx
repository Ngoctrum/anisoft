import { ToolsListPage } from '@/components/ToolsListPage';
import { Code2 } from 'lucide-react';

export default function Code() {
  return (
    <ToolsListPage
      title="Mã Nguồn & Code"
      description="Khám phá và tải về các đoạn code, script, và source code chất lượng cao"
      category="code"
      icon={<Code2 className="h-10 w-10" />}
    />
  );
}
