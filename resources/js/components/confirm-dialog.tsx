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
 * quietly; `caution` for serious but reversible ones; `constructive` for
 * actions that grant something — still consequential, but not a warning.
 */
type Tone = 'destructive' | 'caution' | 'constructive';

type Base = {
    /** POST endpoint the confirmation submits to. */
    action: string;
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
    /** Runs after the action succeeds — close a controlled dialog here. */
    onSuccess?: () => void;
};

/**
 * Either the dialog renders its own trigger button, or the parent drives it —
 * the latter for rows whose action is reached some other way. The union keeps
 * the two from being mixed.
 */
type Props = Base &
    (
        | {
              triggerLabel: string;
              triggerIcon?: React.ElementType;
              open?: never;
              onOpenChange?: never;
          }
        | {
              triggerLabel?: never;
              triggerIcon?: never;
              open: boolean;
              onOpenChange: (open: boolean) => void;
          }
    );

const TONE: Record<
    Tone,
    {
        triggerVariant: 'default' | 'outline';
        trigger: string;
        confirm: string;
    }
> = {
    destructive: {
        triggerVariant: 'outline',
        trigger: 'text-destructive hover:text-destructive',
        confirm: 'bg-destructive text-on-destructive hover:bg-destructive/90',
    },
    caution: {
        triggerVariant: 'outline',
        trigger: 'text-attention hover:text-attention',
        confirm: 'bg-attention text-on-attention hover:bg-attention/90',
    },
    // Granting something leads with the primary action rather than a warning.
    constructive: {
        triggerVariant: 'default',
        trigger: '',
        confirm: '',
    },
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
    onSuccess,
    open: controlledOpen,
    onOpenChange,
}: Props) {
    const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
    const [reasonText, setReasonText] = useState('');
    const fieldId = `confirm-reason-${id}`;
    const isControlled = controlledOpen !== undefined;

    return (
        <Dialog
            open={isControlled ? controlledOpen : uncontrolledOpen}
            onOpenChange={(next) => {
                if (isControlled) {
                    onOpenChange?.(next);
                } else {
                    setUncontrolledOpen(next);
                }

                // Start clean next time. Reopening after a cancelled ban should
                // not present the reason that was abandoned.
                if (!next) {
                    setReasonText('');
                }
            }}
        >
            {triggerLabel && (
                <DialogTrigger asChild>
                    <Button
                        variant={TONE[tone].triggerVariant}
                        size="sm"
                        className={TONE[tone].trigger}
                    >
                        {TriggerIcon && (
                            <TriggerIcon className="mr-1.5 size-3.5" />
                        )}
                        {triggerLabel}
                    </Button>
                </DialogTrigger>
            )}

            <DialogContent>
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>{description}</DialogDescription>

                <Form
                    action={action}
                    method="post"
                    className="space-y-4"
                    options={{ preserveScroll: true }}
                    onSuccess={() => {
                        setReasonText('');
                        onSuccess?.();
                    }}
                >
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
                                    className={cn(TONE[tone].confirm)}
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
