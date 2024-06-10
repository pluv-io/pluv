import { Avatar as BaseAvatar } from "./Avatar";
import { AvatarFallback } from "./AvatarFallback";
import { AvatarGitHubImage } from "./AvatarGitHubImage";
import { AvatarImage } from "./AvatarImage";

export * from "./AvatarFallback";
export * from "./AvatarGitHubImage";
export * from "./AvatarImage";

export const Avatar = Object.assign(BaseAvatar, {
    Fallback: AvatarFallback,
    GitHubImage: AvatarGitHubImage,
    Image: AvatarImage,
});
