import { InferComponentProps } from "@pluv-internal/typings";
import tw from "twin.macro";

export type PageContainerProps = InferComponentProps<typeof PageContainer>;

export const PageContainer = tw.div`
	w-full
	py-0
	px-2
	sm:px-4
`;
