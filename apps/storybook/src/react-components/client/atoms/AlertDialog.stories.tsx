import { AlertDialog } from "@pluv-internal/react-components/client";
import { Button } from "@pluv-internal/react-components/either";
import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta<typeof AlertDialog> = {
    title: "components/client/atoms/AlertDialog",
    component: AlertDialog,
};

export default meta;

type Story = StoryObj<typeof AlertDialog>;

export const Basic: Story = {
    render: (args) => (
        <AlertDialog>
            <AlertDialog.Trigger asChild>
                <Button variant="outline">Show Dialog</Button>
            </AlertDialog.Trigger>
            <AlertDialog.Content>
                <AlertDialog.Header>
                    <AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
                    <AlertDialog.Description>
                        This action cannot be undone. This will permanently delete your account and remove your data
                        from our servers.
                    </AlertDialog.Description>
                </AlertDialog.Header>
                <AlertDialog.Footer>
                    <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
                    <AlertDialog.Action>Continue</AlertDialog.Action>
                </AlertDialog.Footer>
            </AlertDialog.Content>
        </AlertDialog>
    ),
};
