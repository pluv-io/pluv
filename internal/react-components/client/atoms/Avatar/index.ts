import { Avatar as BaseAvatar } from "./Avatar";
import { AvatarAnimal } from "./AvatarAnimal";
import { AvatarFallback } from "./AvatarFallback";
import { AvatarGitHubImage } from "./AvatarGitHubImage";
import { AvatarImage } from "./AvatarImage";

export * from "./AvatarAnimal";
export * from "./AvatarFallback";
export * from "./AvatarGitHubImage";
export * from "./AvatarImage";

export const Avatar = Object.assign(BaseAvatar, {
    Animal: AvatarAnimal,
    Fallback: AvatarFallback,
    GitHubImage: AvatarGitHubImage,
    Image: AvatarImage,
});
