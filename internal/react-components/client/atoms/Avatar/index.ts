import { Avatar as BaseAvatar } from "./Avatar";
import { AvatarAnimal } from "./AvatarAnimal";
import { AvatarCount } from "./AvatarCount";
import { AvatarFallback } from "./AvatarFallback";
import { AvatarGitHubImage } from "./AvatarGitHubImage";
import { AvatarGroup } from "./AvatarGroup";
import { AvatarImage } from "./AvatarImage";

export * from "./AvatarAnimal";
export * from "./AvatarCount";
export * from "./AvatarFallback";
export * from "./AvatarGitHubImage";
export * from "./AvatarGroup";
export * from "./AvatarImage";

export const Avatar = Object.assign(BaseAvatar, {
    Animal: AvatarAnimal,
    Count: AvatarCount,
    Fallback: AvatarFallback,
    GitHubImage: AvatarGitHubImage,
    Group: AvatarGroup,
    Image: AvatarImage,
});
