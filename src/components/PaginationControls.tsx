import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationControlsProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage?: number;
  filteredItems: number;
  onPageChange: (page: number) => void;
  showItemCount?: boolean;
}

export default function PaginationControls({
  currentPage,
  totalItems,
  itemsPerPage = 10,
  filteredItems,
  onPageChange,
  showItemCount = true,
}: PaginationControlsProps) {
  const totalPages = Math.ceil(filteredItems / itemsPerPage);
  const isLastPage = currentPage >= totalPages;

  return (
    <div className="flex items-center justify-between">
      {showItemCount && (
        <p className="text-sm text-muted-foreground">
          Showing {filteredItems} of {totalItems} entries
        </p>
      )}
      
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="icon"
          disabled={currentPage === 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <span className="text-sm font-medium px-4">Page {currentPage}</span>
        
        <Button 
          variant="outline" 
          size="icon"
          disabled={isLastPage}
          onClick={() => onPageChange(currentPage + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
