import { Card, CardContent, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Download, Star } from 'lucide-react';
import { Badge } from './ui/badge';
import { Link } from 'react-router-dom';

interface ToolCardProps {
  id: string;
  title: string;
  slug: string;
  short_description?: string;
  thumbnail_url?: string;
  category: string;
  tags?: string[];
  total_downloads: number;
  is_featured?: boolean;
}

export const ToolCard = ({
  title,
  slug,
  short_description,
  thumbnail_url,
  category,
  tags,
  total_downloads,
  is_featured,
}: ToolCardProps) => {
  return (
    <Card className="group overflow-hidden bg-gradient-card border-border hover:border-primary/50 transition-all hover:shadow-glow">
      <Link to={`/tools/${slug}`}>
        <div className="aspect-video overflow-hidden bg-muted relative">
          {thumbnail_url ? (
            <img
              src={thumbnail_url}
              alt={title}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-primary opacity-20">
              <Download className="h-12 w-12" />
            </div>
          )}
          {is_featured && (
            <div className="absolute top-2 right-2">
              <Badge className="bg-accent text-accent-foreground">
                <Star className="h-3 w-3 mr-1" />
                Nổi bật
              </Badge>
            </div>
          )}
        </div>
      </Link>

      <CardContent className="p-4">
        <Link to={`/tools/${slug}`}>
          <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-1">
            {title}
          </h3>
        </Link>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {short_description || 'No description available'}
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{category}</Badge>
          {tags?.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <span className="text-sm text-muted-foreground flex items-center gap-1">
          <Download className="h-4 w-4" />
          {total_downloads.toLocaleString()}
        </span>
        <Button asChild size="sm" className="bg-gradient-primary hover:opacity-90">
          <Link to={`/tools/${slug}`}>Xem chi tiết</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};