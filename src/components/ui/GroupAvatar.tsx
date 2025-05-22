import React from 'react';
import { Image } from 'react-feather';

interface GroupAvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function GroupAvatar({ name, imageUrl, size = 'md', className = '' }: GroupAvatarProps) {
  // Extract initials from the name
  const getInitials = (name: string) => {
    // Split the name by spaces and get the first two parts
    const parts = name.trim().split(/\s+/).slice(0, 2);
    
    // Get the first letter of each part and join them
    return parts.map(part => part.charAt(0).toUpperCase()).join('');
  };

  // Generate a deterministic color based on the name
  const getBackgroundColor = (name: string) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 
      'bg-yellow-500', 'bg-indigo-500', 'bg-red-500', 'bg-teal-500'
    ];
    
    // Simple hash function for strings
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Use the hash to pick a color
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  // Size classes
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-24 h-24 text-xl'
  };

  const initials = getInitials(name);
  const bgColor = getBackgroundColor(name);

  if (imageUrl) {
    return (
      <div className={`relative overflow-hidden rounded-md ${sizeClasses[size]} ${className}`}>
        <img 
          src={imageUrl} 
          alt={name} 
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.currentTarget as HTMLImageElement;
            target.style.display = 'none';
            if (target.parentElement) {
              target.parentElement.classList.add(bgColor);
              // Find the next sibling and show it
              const nextSibling = target.nextElementSibling as HTMLElement;
              if (nextSibling) {
                nextSibling.style.display = 'flex';
              }
            }
          }} 
        />
        <div className={`absolute inset-0 items-center justify-center text-white font-medium hidden`}>
          {initials || <Image className="w-1/2 h-1/2 opacity-70" />}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center rounded-md ${sizeClasses[size]} ${bgColor} text-white font-medium ${className}`}>
      {initials || <Image className="w-1/2 h-1/2 opacity-70" />}
    </div>
  );
} 