"use client"

import { FileText, Video, Link2, BookOpen, Download, ExternalLink, ArrowRight } from 'lucide-react';

interface ResourceCardProps {
  resource: {
    id: string;
    title: string;
    description: string;
    type: 'video' | 'pdf' | 'link' | 'article';
    file_url?: string;
    external_url?: string;
  };
}

export function ResourceCard({ resource }: ResourceCardProps) {
  const getIcon = () => {
    switch (resource.type) {
      case 'video':
        return <Video className="w-4 h-4 sm:w-5 sm:h-5" />;
      case 'pdf':
        return <FileText className="w-4 h-4 sm:w-5 sm:h-5" />;
      case 'link':
        return <Link2 className="w-4 h-4 sm:w-5 sm:h-5" />;
      case 'article':
        return <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />;
      default:
        return <FileText className="w-4 h-4 sm:w-5 sm:h-5" />;
    }
  };

  const getActionIcon = () => {
    if (resource.type === 'pdf' && resource.file_url) {
      return <Download className="w-3 h-3 sm:w-4 sm:h-4" />;
    }
    return <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />;
  };

  const handleClick = () => {
    const url = resource.file_url || resource.external_url;
    if (!url) return;

    if (resource.type === 'pdf' && resource.file_url) {
      // For PDFs, open in new tab or trigger download
      window.open(url, '_blank');
    } else {
      // For other types, navigate to external URL
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <button
      onClick={handleClick}
      className="group bg-blue-900 hover:bg-blue-800 text-white rounded-lg p-4 sm:p-6 transition-all duration-200 text-left w-full"
    >
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-800 group-hover:bg-blue-700 rounded-lg flex items-center justify-center transition-colors">
            {getIcon()}
          </div>
        </div>
        
        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-800 group-hover:bg-blue-700 rounded-full flex items-center justify-center transition-all group-hover:scale-110">
          {getActionIcon()}
        </div>
      </div>

      <h3 className="text-base sm:text-lg font-bold mb-2 line-clamp-2">{resource.title}</h3>
      <p className="text-xs sm:text-sm text-blue-100 leading-relaxed line-clamp-3">
        {resource.description}
      </p>

      {resource.type === 'pdf' && (
        <div className="mt-3 sm:mt-4 flex items-center gap-2 text-xs text-blue-200">
          <FileText className="w-3 h-3" />
          <span>PDF Document</span>
        </div>
      )}
    </button>
  );
}