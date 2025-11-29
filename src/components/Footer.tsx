import { Link } from 'react-router-dom';
import { Facebook, Youtube, Mail, MessageCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const Footer = () => {
  const [contactSettings, setContactSettings] = useState<any>({});
  
  useEffect(() => {
    const loadContactSettings = async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'contact')
        .single();
      
      if (data?.value) {
        setContactSettings(data.value);
      }
    };
    
    loadContactSettings();
  }, []);
  
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
              {contactSettings.facebook_url && (
                <a 
                  href={contactSettings.facebook_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {contactSettings.youtube_url && (
                <a 
                  href={contactSettings.youtube_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label="YouTube"
                >
                  <Youtube className="h-5 w-5" />
                </a>
              )}
              {contactSettings.zalo_url && (
                <a 
                  href={contactSettings.zalo_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label="Zalo"
                >
                  <MessageCircle className="h-5 w-5" />
                </a>
              )}
              {contactSettings.contact_email && (
                <a 
                  href={`mailto:${contactSettings.contact_email}`}
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label="Email"
                >
                  <Mail className="h-5 w-5" />
                </a>
              )}
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