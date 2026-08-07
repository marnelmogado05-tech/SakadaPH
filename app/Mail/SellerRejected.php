<?php

namespace App\Mail;

use App\Models\Store;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SellerRejected extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public readonly Store $store) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your store application was not approved — Sakada.ph',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.seller.rejected',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
