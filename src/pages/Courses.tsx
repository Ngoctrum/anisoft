import { ToolsListPage } from '@/components/ToolsListPage';
import { BookOpen } from 'lucide-react';
import { PageAccessControl } from '@/components/PageAccessControl';

export default function Courses() {
  return (
    <PageAccessControl pageKey="courses_enabled" pageName="Khóa học">
      <ToolsListPage
        title="Khóa học Website"
        description="Học lập trình web từ cơ bản đến nâng cao với các khóa học chất lượng"
        category="courses"
        icon={<BookOpen className="h-10 w-10" />}
      />
    </PageAccessControl>
  );
}
