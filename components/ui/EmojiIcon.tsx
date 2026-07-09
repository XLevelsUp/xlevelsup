import React from 'react';
import * as Icons from 'lucide-react';

const emojiMap: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  // Solutions & Benefits
  '⚡': Icons.Zap,
  '🎯': Icons.Target,
  '📱': Icons.Smartphone,
  '📲': Icons.SmartphoneCharging,
  '🔍': Icons.Search,
  '💰': Icons.Coins,
  '🔒': Icons.Lock,
  '📊': Icons.BarChart3,
  '🚀': Icons.Rocket,
  '📈': Icons.TrendingUp,
  '🔄': Icons.RefreshCw,
  '⚛️': Icons.Atom,
  '🎨': Icons.Palette,
  '🌐': Icons.Globe,
  '🤖': Icons.Bot,
  '🏗️': Icons.Building2,
  '⚙️': Icons.Settings,
  '🔧': Icons.Wrench,
  '📝': Icons.FileText,
  '🎬': Icons.Video,
  '🎞️': Icons.Film,
  '✂️': Icons.Scissors,
  '📅': Icons.Calendar,
  '🐍': Icons.Terminal, // fallback for Python
  '🔗': Icons.Link,
  '💬': Icons.MessageSquare,
  '✍️': Icons.PenTool,
  '💡': Icons.Lightbulb,
  '✨': Icons.Sparkles,
  '🤝': Icons.Handshake,
  '🏢': Icons.Building,
  '💼': Icons.Briefcase,
  '🚫': Icons.Ban,
  '📉': Icons.TrendingDown,
  '💸': Icons.Banknote,
  '⏰': Icons.Clock,
  '🐌': Icons.Hourglass,
};

export default function EmojiIcon({
  emoji,
  className = 'w-6 h-6',
}: {
  emoji: string;
  className?: string;
}) {
  const IconComponent = emojiMap[emoji];
  if (!IconComponent) {
    // Fallback if no matching Lucide icon is defined
    return <span className="text-xl inline-block leading-none">{emoji}</span>;
  }
  return <IconComponent className={className} strokeWidth={1.5} />;
}
