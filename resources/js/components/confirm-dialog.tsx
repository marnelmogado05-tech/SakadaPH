import { Form } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

/**
 * `destructive` for actions that take something away and cannot be undone
 * quietly; `caution` for serious but reversible ones.
 */
type Tone = 'destructive' | 'caution';

type Props = {
    /** POST endpoint the confirmation submits to. */
    action: string;
    triggerLabel: string;
    triggerIcon?: React.ElementType;
    title: ReactNode;
    /** What will actually happen — not "are you sure". */
    description: ReactNode;
    confirmLabel: string;
    tone: Tone;
    /**
     * When present a reason is required and posted as `reason`. Omit for
     * actions the backend does not ask to justify.
     */
    reason?: { placeholder: string; label?: string };
    /** Disambiguates the field id when several dialogs share a page. */
    id: string | number;
};

const TRIGGER_TONE: Record<Tone, string> = {
    destructive: 'text-destructive hover:text-destructive',
    caution: 'text-attention hover:text-attention',
};

const CONFIRM_TONE: Record<Tone, string> = {
    destructive: 'bg-destructive text-on-destructive hover:bg-destructive/90',
    caution: 'bg-attention text-on-attention hover:bg-attention/90',
};

/**
 * The single confirmation used across the admin screens. It replaces three
 * hand-rolled dialogs that differed only in their wording, and keeps the
 * consequence — not a question — in the description.
 */
export default function ConfirmDialog({
    action,
    triggerLabel,
    triggerIcon: TriggerIcon,
    title,
    description,
    confirmLabel,
    tone,
    reason,
    id,
}: Props) {
    const [reasonText, setReasonText] = useState('');
    const fieldId = `confirm-reason-${id}`;

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className={TRIGGER_TONE[tone]}
                >
                    {TriggerIcon && <TriggerIcon className="mr-1.5 size-3.5" />}
                    {triggerLabel}
                </Button>
            </DialogTrigger>

            <DialogContent>
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>{description}</DialogDescription>

                <Form action={action} method="post" className="space-y-4">
                    {({ processing, errors }) => (
                        <>
                            {reason && (
                                <div className="grid gap-2">
                                    <Label htmlFor={fieldId}>
                                        {reason.label ?? 'Reason'}
                                    </Label>
                                    <Textarea
                                        id={fieldId}
                                        name="reason"
                                        rows={3}
                                        required
                                        placeholder={reason.placeholder}
                                        value={reasonText}
                                        onChange={(e) =>
                                            setReasonText(e.target.value)
                                        }
                                    />
                                    {errors.reason && (
                                        <p className="text-sm text-destructive">
                                            {errors.reason}
                                        </p>
                                    )}
                                </div>
                            )}

                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="ghost">
                                        Cancel
                                    </Button>
                                </DialogClose>
                                <Button
                                    type="submit"
                                    disabled={
                                        processing ||
                                        (reason !== undefined &&
                                            !reasonText.trim())
                                    }
                                    className={cn(CONFIRM_TONE[tone])}
                                >
                                    {processing && <Spinner />}
                                    {confirmLabel}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
