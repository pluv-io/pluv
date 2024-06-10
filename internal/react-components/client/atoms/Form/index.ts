import { Form as BaseForm } from "./Form";
import { FormControl } from "./FormControl";
import { FormDescription } from "./FormDescription";
import { FormField } from "./FormField";
import { FormItem } from "./FormItem";
import { FormLabel } from "./FormLabel";
import { FormMessage } from "./FormMessage";
import { useFormContext } from "./useFormContext";
import { useFormField } from "./useFormField";

export const Form = Object.assign(BaseForm, {
    Control: FormControl,
    Description: FormDescription,
    Field: FormField,
    Item: FormItem,
    Label: FormLabel,
    Message: FormMessage,
    useContext: useFormContext,
    useField: useFormField,
});
