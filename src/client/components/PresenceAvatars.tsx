import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  AvatarGroup,
  AvatarGroupCount,
} from "./ui/avatar";
import { contrastText } from "./contrastText";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

export type Peer = {
  name: string;
  color: string;
  image?: string | null;
};

const MAX_VISIBLE = 4;

export function PresenceAvatars({ peers }: { peers: Peer[] }) {
  if (peers.length === 0) return null;

  const visible = peers.slice(0, MAX_VISIBLE);
  const overflow = peers.length - MAX_VISIBLE;

  return (
    <TooltipProvider delayDuration={200}>
      <AvatarGroup>
        {visible.map((peer, i) => (
          <Tooltip key={i}>
            <TooltipTrigger asChild>
              <Avatar
                size="sm"
                className="ring-1"
                style={{ "--tw-ring-color": peer.color } as React.CSSProperties}
              >
                {peer.image && <AvatarImage src={peer.image} alt={peer.name} />}
                <AvatarFallback
                  style={{
                    backgroundColor: peer.color,
                    color: contrastText(peer.color),
                  }}
                >
                  {peer.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {peer.name}
            </TooltipContent>
          </Tooltip>
        ))}
        {overflow > 0 && (
          <AvatarGroupCount className="text-xs">+{overflow}</AvatarGroupCount>
        )}
      </AvatarGroup>
    </TooltipProvider>
  );
}
