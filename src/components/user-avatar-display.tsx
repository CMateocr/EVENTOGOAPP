import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface UserAvatarDisplayProps {
  image?: string | null;
  name?: string;
  className?: string;
}

export function UserAvatarDisplay({ image, name, className }: UserAvatarDisplayProps) {
  const initial = name ? name.charAt(0).toUpperCase() : "U";
  
  return (
    <Avatar className={className}>
      {image ? (
        <AvatarImage src={image} alt={name || "User"} />
      ) : null}
      <AvatarFallback>{initial}</AvatarFallback>
    </Avatar>
  )
}