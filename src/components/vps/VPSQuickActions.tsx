import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  MoreVertical, 
  Copy, 
  Trash2, 
  Power, 
  PowerOff, 
  Download, 
  Eye, 
  RefreshCw 
} from 'lucide-react';
import { toast } from 'sonner';

interface VPSQuickActionsProps {
  sessionId: string;
  sessionName: string;
  isActive: boolean;
  onDelete: () => void;
  onKill: () => void;
  onStart: () => void;
  onViewLogs: () => void;
  onClone?: () => void;
}

export function VPSQuickActions({
  sessionId,
  sessionName,
  isActive,
  onDelete,
  onKill,
  onStart,
  onViewLogs,
  onClone,
}: VPSQuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleCopySessionId = () => {
    navigator.clipboard.writeText(sessionId);
    toast.success('Đã copy Session ID');
    setIsOpen(false);
  };

  const handleAction = (action: () => void) => {
    setIsOpen(false);
    action();
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleCopySessionId} className="cursor-pointer">
          <Copy className="h-4 w-4 mr-2" />
          Copy Session ID
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handleAction(onViewLogs)} className="cursor-pointer">
          <Eye className="h-4 w-4 mr-2" />
          Xem Logs
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {isActive ? (
          <DropdownMenuItem 
            onClick={() => handleAction(onKill)} 
            className="cursor-pointer text-destructive"
          >
            <PowerOff className="h-4 w-4 mr-2" />
            Tắt VPS
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem 
            onClick={() => handleAction(onStart)} 
            className="cursor-pointer text-green-500"
          >
            <Power className="h-4 w-4 mr-2" />
            Khởi động lại
          </DropdownMenuItem>
        )}

        {onClone && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => handleAction(onClone)} 
              className="cursor-pointer"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Clone VPS
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem 
          onClick={() => handleAction(onDelete)} 
          className="cursor-pointer text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Xóa Session
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
