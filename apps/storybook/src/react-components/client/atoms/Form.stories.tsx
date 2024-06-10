/* eslint-disable react-hooks/rules-of-hooks */
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@pluv-internal/react-components/client";
import { Button, Input } from "@pluv-internal/react-components/either";
import type { Meta, StoryObj } from "@storybook/react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const meta: Meta<typeof Form> = {
    title: "components/client/atoms/Form",
    component: Form,
};

export default meta;

type Story = StoryObj<typeof Form>;

const formSchema = z.object({
    username: z.string().min(2, {
        message: "Username must be at least 2 characters.",
    }),
});

export const Basic: Story = {
    render: (args) => {
        // 1. Define your form.
        const form = useForm<z.infer<typeof formSchema>>({
            resolver: zodResolver(formSchema),
            defaultValues: {
                username: "",
            },
        });

        // 2. Define a submit handler.
        function onSubmit(values: z.infer<typeof formSchema>) {
            // Do something with the form values.
            // ✅ This will be type-safe and validated.
            console.log(values);
        }

        return (
            <Form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8" form={form}>
                <Form.Field
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                        <Form.Item>
                            <Form.Label>Username</Form.Label>
                            <Form.Control>
                                <Input placeholder="leedavidcs" {...field} />
                            </Form.Control>
                            <Form.Description>This is your public display name.</Form.Description>
                            <Form.Message />
                        </Form.Item>
                    )}
                />
                <Button type="submit">Submit</Button>
            </Form>
        );
    },
};
