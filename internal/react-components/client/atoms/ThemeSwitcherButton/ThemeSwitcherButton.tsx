import { useNoSsr, useTheme } from "@pluv-internal/react-hooks";
import { MonitorIcon, MoonIcon, SunIcon } from "@pluv-internal/react-icons";
import type { ComponentProps } from "react";
import { forwardRef } from "react";
import { Button } from "../../../either/atoms/Button";
import { DropdownMenu } from "../DropdownMenu";

export type ThemeSwitcherButtonProps = ComponentProps<"button">;

export const ThemeSwitcherButton = forwardRef<HTMLButtonElement, ThemeSwitcherButtonProps>((props, ref) => {
    const noSsr = useNoSsr();
    const { setTheme, theme = "system" } = useTheme();

    return noSsr(
        <DropdownMenu>
            <DropdownMenu.Trigger asChild>
                <button aria-label="Change theme" {...props} ref={ref} type="button">
                    {noSsr(
                        theme === "light" ? (
                            <SunIcon height={16} width={16} />
                        ) : theme === "dark" ? (
                            <MoonIcon height={16} width={16} />
                        ) : (
                            <MonitorIcon height={16} width={16} />
                        ),
                    )}
                </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
                <DropdownMenu.CheckboxItem
                    checked={theme === "light"}
                    onCheckedChange={() => {
                        setTheme("light");
                    }}
                >
                    <SunIcon className="mr-2" height={16} width={16} />
                    <span>Light</span>
                </DropdownMenu.CheckboxItem>
                <DropdownMenu.CheckboxItem
                    checked={theme === "dark"}
                    onCheckedChange={() => {
                        setTheme("dark");
                    }}
                >
                    <MoonIcon className="mr-2" height={16} width={16} />
                    <span>Dark</span>
                </DropdownMenu.CheckboxItem>
                <DropdownMenu.CheckboxItem
                    checked={theme === "system"}
                    onCheckedChange={() => {
                        setTheme("system");
                    }}
                >
                    <MonitorIcon className="mr-2" height={16} width={16} />
                    <span>System</span>
                </DropdownMenu.CheckboxItem>
            </DropdownMenu.Content>
        </DropdownMenu>,
        <Button aria-label="Change theme" {...props} ref={ref} size="icon" type="button" variant="outline">
            <div className="size-4" />
        </Button>,
    );
});

ThemeSwitcherButton.displayName = "ThemeSwitcherButton";
