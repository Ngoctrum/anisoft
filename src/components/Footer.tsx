import { Link } from 'react-router-dom';
import { Facebook, Youtube, Mail } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-primary" />
              <span className="text-lg font-bold">Ani Studio</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Your Hub for Tools & Code
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Danh mục</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/tools" className="text-muted-foreground hover:text-primary transition-colors">
                  Tools
                </Link>
              </li>
              <li>
                <Link to="/docs" className="text-muted-foreground hover:text-primary transition-colors">
                  Hướng dẫn
                </Link>
              </li>
              <li>
                <Link to="/support" className="text-muted-foreground hover:text-primary transition-colors">
                  Hỗ trợ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Hỗ trợ</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/report" className="text-muted-foreground hover:text-primary transition-colors">
                  Báo lỗi
                </Link>
              </li>
              <li>
                <Link to="/docs" className="text-muted-foreground hover:text-primary transition-colors">
                  Tài liệu
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Liên hệ</h3>
            <div className="flex gap-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Youtube className="h-5 w-5" />
              </a>
              <a href="mailto:contact@anistudio.com" className="text-muted-foreground hover:text-primary transition-colors">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Ani Studio. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};