<?php

namespace App\Mail;

use App\Models\Store;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SellerApproved extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public readonly Store $store) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your store has been approved — Sakada.ph',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.seller.approved',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
